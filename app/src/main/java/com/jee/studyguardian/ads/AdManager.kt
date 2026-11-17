package com.jee.studyguardian.ads

import android.app.Activity
import android.content.Context
import android.os.Handler
import android.os.Looper
import android.view.Gravity
import android.widget.FrameLayout
import com.google.android.gms.ads.AdError
import com.google.android.gms.ads.AdListener
import com.google.android.gms.ads.AdRequest
import com.google.android.gms.ads.AdSize
import com.google.android.gms.ads.AdView
import com.google.android.gms.ads.FullScreenContentCallback
import com.google.android.gms.ads.LoadAdError
import com.google.android.gms.ads.MobileAds
import com.google.android.gms.ads.RequestConfiguration
import com.google.android.gms.ads.interstitial.InterstitialAd
import com.google.android.gms.ads.interstitial.InterstitialAdLoadCallback
import com.google.android.gms.ads.rewarded.RewardedAd
import com.google.android.gms.ads.rewarded.RewardedAdLoadCallback
import com.google.android.ump.ConsentInformation
import com.google.android.ump.ConsentRequestParameters
import com.google.android.ump.UserMessagingPlatform
import com.jee.studyguardian.BuildConfig
import com.jee.studyguardian.firebase.FirebaseSyncManager
import com.unity3d.ads.IUnityAdsInitializationListener
import com.unity3d.ads.IUnityAdsLoadListener
import com.unity3d.ads.IUnityAdsShowListener
import com.unity3d.ads.UnityAds
import com.unity3d.ads.UnityAdsLoadOptions
import com.unity3d.ads.UnityAdsShowOptions
import com.unity3d.services.banners.BannerErrorInfo
import com.unity3d.services.banners.BannerView
import com.unity3d.services.banners.UnityBannerSize
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import java.lang.ref.WeakReference

/**
 * Unified AdMob + Unity Ads Manager (Unity Game ID: BuildConfig.UNITY_GAME_ID = 800441454).
 * - Dispatches ALL AdMob and Unity Ads callbacks onto Android's Main Thread safely.
 * - Uses official Google Test Ad Unit IDs & Unity testMode in DEBUG builds.
 * - In RELEASE builds when production AdMob IDs are not overridden, routes directly through
 *   Unity Ads (Banner_Android, Interstitial_Android, Rewarded_Android) so ads load cleanly.
 * - Enforces age-appropriate ad treatment, UMP Consent, and 60s interstitial cooldown.
 * - Never shows interstitials during active Mock Tests or Focus Mode sessions.
 */
object AdManager {

    private val mainHandler = Handler(Looper.getMainLooper())

    @Volatile
    private var isMobileAdsInitialized = false

    @Volatile
    private var unityInitStarted = false

    @Volatile
    private var unityInitComplete = false

    @Volatile
    private var unityInterstitialReady = false

    @Volatile
    private var unityRewardedReady = false

    @Volatile
    private var lastInterstitialShownMs = 0L

    private const val MIN_INTERSTITIAL_INTERVAL_MS = 60_000L

    private var interstitialAd: InterstitialAd? = null
    private var rewardedAd: RewardedAd? = null

    private val pendingUnityBanners = mutableListOf<WeakReference<BannerView>>()

    private const val SAMPLE_ADMOB_PREFIX = "ca-app-pub-3940256099942544"
    private const val UNITY_BANNER_PLACEMENT = "BP_Banner_Android"
    private const val UNITY_INTERSTITIAL_PLACEMENT = "BP_Interstitial_Android"
    private const val UNITY_REWARDED_PLACEMENT = "BP_Rewarded_Android"

    private val _consentRequired = MutableStateFlow(false)
    val consentRequired: StateFlow<Boolean> = _consentRequired.asStateFlow()

    private val _canRequestAds = MutableStateFlow(true)
    val canRequestAds: StateFlow<Boolean> = _canRequestAds.asStateFlow()

    val bannerAdUnitId: String
        get() = if (BuildConfig.DEBUG) "$SAMPLE_ADMOB_PREFIX/9214589741" else BuildConfig.ADMOB_BANNER_ID

    val interstitialAdUnitId: String
        get() = if (BuildConfig.DEBUG) "$SAMPLE_ADMOB_PREFIX/1033173712" else BuildConfig.ADMOB_INTERSTITIAL_ID

    val rewardedAdUnitId: String
        get() = if (BuildConfig.DEBUG) "$SAMPLE_ADMOB_PREFIX/5224354917" else BuildConfig.ADMOB_REWARDED_ID

    val nativeAdUnitId: String
        get() = if (BuildConfig.DEBUG) "$SAMPLE_ADMOB_PREFIX/2247696110" else BuildConfig.ADMOB_NATIVE_ID

    private fun preferUnityDirectly(adUnitId: String): Boolean {
        return !BuildConfig.DEBUG &&
            adUnitId.startsWith(SAMPLE_ADMOB_PREFIX) &&
            BuildConfig.UNITY_GAME_ID.isNotBlank()
    }

    private fun runOnMain(block: () -> Unit) {
        if (Looper.myLooper() == Looper.getMainLooper()) {
            block()
        } else {
            mainHandler.post(block)
        }
    }

    fun configureAgeAppropriateRequestConfig(underAgeSafe: Boolean = true) {
        val builder = RequestConfiguration.Builder()
            .setMaxAdContentRating(RequestConfiguration.MAX_AD_CONTENT_RATING_T)
        if (underAgeSafe) {
            builder.setTagForUnderAgeOfConsent(RequestConfiguration.TAG_FOR_UNDER_AGE_OF_CONSENT_TRUE)
        } else {
            builder.setTagForUnderAgeOfConsent(RequestConfiguration.TAG_FOR_UNDER_AGE_OF_CONSENT_UNSPECIFIED)
        }
        runCatching { MobileAds.setRequestConfiguration(builder.build()) }
    }

    fun gatherConsentAndInitialize(activity: Activity, underAgeSafe: Boolean = true) {
        configureAgeAppropriateRequestConfig(underAgeSafe)
        initializeUnityAds(activity.applicationContext)

        val params = ConsentRequestParameters.Builder()
            .setTagForUnderAgeOfConsent(underAgeSafe)
            .build()

        val consentInfo: ConsentInformation = UserMessagingPlatform.getConsentInformation(activity)
        consentInfo.requestConsentInfoUpdate(
            activity,
            params,
            {
                _consentRequired.value = consentInfo.privacyOptionsRequirementStatus ==
                    ConsentInformation.PrivacyOptionsRequirementStatus.REQUIRED
                UserMessagingPlatform.loadAndShowConsentFormIfRequired(activity) { _ ->
                    _canRequestAds.value = consentInfo.canRequestAds()
                    if (consentInfo.canRequestAds()) {
                        initializeMobileAds(activity.applicationContext)
                    }
                }
            },
            {
                if (consentInfo.canRequestAds()) {
                    initializeMobileAds(activity.applicationContext)
                }
            }
        )

        if (consentInfo.canRequestAds()) {
            initializeMobileAds(activity.applicationContext)
        }
    }

    @Synchronized
    fun initializeUnityAds(context: Context) {
        if (unityInitComplete || unityInitStarted) return
        val gameId = BuildConfig.UNITY_GAME_ID
        if (gameId.isBlank()) return
        unityInitStarted = true
        UnityAds.initialize(
            context.applicationContext,
            gameId,
            BuildConfig.DEBUG,
            object : IUnityAdsInitializationListener {
                override fun onInitializationComplete() {
                    runOnMain {
                        unityInitComplete = true
                        unityInitStarted = false
                        preloadUnityInterstitial()
                        preloadUnityRewarded()
                        flushPendingUnityBanners()
                    }
                }

                override fun onInitializationFailed(
                    error: UnityAds.UnityAdsInitializationError?,
                    message: String?
                ) {
                    runOnMain {
                        unityInitStarted = false
                        unityInitComplete = false
                    }
                }
            }
        )
    }

    private fun flushPendingUnityBanners() {
        val iterator = pendingUnityBanners.iterator()
        while (iterator.hasNext()) {
            val banner = iterator.next().get()
            if (banner != null && banner.isAttachedToWindow) {
                runCatching { banner.load() }
            }
            iterator.remove()
        }
    }

    private fun preloadUnityInterstitial() {
        if (!unityInitComplete && !UnityAds.isInitialized) return
        UnityAds.load(
            UNITY_INTERSTITIAL_PLACEMENT,
            UnityAdsLoadOptions(),
            object : IUnityAdsLoadListener {
                override fun onUnityAdsAdLoaded(placementId: String?) {
                    runOnMain { unityInterstitialReady = true }
                }

                override fun onUnityAdsFailedToLoad(
                    placementId: String?,
                    error: UnityAds.UnityAdsLoadError?,
                    message: String?
                ) {
                    runOnMain { unityInterstitialReady = false }
                }
            }
        )
    }

    private fun preloadUnityRewarded() {
        if (!unityInitComplete && !UnityAds.isInitialized) return
        UnityAds.load(
            UNITY_REWARDED_PLACEMENT,
            UnityAdsLoadOptions(),
            object : IUnityAdsLoadListener {
                override fun onUnityAdsAdLoaded(placementId: String?) {
                    runOnMain { unityRewardedReady = true }
                }

                override fun onUnityAdsFailedToLoad(
                    placementId: String?,
                    error: UnityAds.UnityAdsLoadError?,
                    message: String?
                ) {
                    runOnMain { unityRewardedReady = false }
                }
            }
        )
    }

    fun showPrivacyOptionsForm(activity: Activity) {
        UserMessagingPlatform.showPrivacyOptionsForm(activity) { _ ->
            val info = UserMessagingPlatform.getConsentInformation(activity)
            _canRequestAds.value = info.canRequestAds()
        }
    }

    @Synchronized
    fun initializeMobileAds(context: Context) {
        if (isMobileAdsInitialized) return
        isMobileAdsInitialized = true
        MobileAds.initialize(context) {
            runOnMain {
                preloadInterstitial(context)
                preloadRewarded(context)
            }
        }
    }

    fun buildAdRequest(personalizedAdsEnabled: Boolean): AdRequest {
        val builder = AdRequest.Builder()
        if (!personalizedAdsEnabled) {
            val extras = android.os.Bundle().apply { putString("npa", "1") }
            builder.addNetworkExtrasBundle(com.google.ads.mediation.admob.AdMobAdapter::class.java, extras)
        }
        return builder.build()
    }

    fun createAdaptiveBannerView(
        context: Context,
        widthDp: Int,
        personalizedAdsEnabled: Boolean
    ): AdView {
        return AdView(context).apply {
            adUnitId = bannerAdUnitId
            setAdSize(AdSize.getCurrentOrientationAnchoredAdaptiveBannerAdSize(context, widthDp.coerceAtLeast(320)))
            loadAd(buildAdRequest(personalizedAdsEnabled))
        }
    }

    private fun attachUnityBanner(activity: Activity, container: FrameLayout) {
        container.removeAllViews()
        initializeUnityAds(activity.applicationContext)

        val unityBanner = BannerView(activity, UNITY_BANNER_PLACEMENT, UnityBannerSize(320, 50))
        val params = FrameLayout.LayoutParams(
            FrameLayout.LayoutParams.WRAP_CONTENT,
            FrameLayout.LayoutParams.WRAP_CONTENT,
            Gravity.CENTER_HORIZONTAL
        )
        unityBanner.listener = object : BannerView.IListener {
            override fun onBannerLoaded(bannerAdView: BannerView?) {
                FirebaseSyncManager.logEvent(activity, "ad_banner_loaded", mapOf("network" to "unity"))
            }

            override fun onBannerShown(bannerAdView: BannerView?) {}
            override fun onBannerClick(bannerAdView: BannerView?) {}
            override fun onBannerFailedToLoad(bannerAdView: BannerView?, errorInfo: BannerErrorInfo?) {}
            override fun onBannerLeftApplication(bannerAdView: BannerView?) {}
        }
        container.addView(unityBanner, params)

        if (unityInitComplete || UnityAds.isInitialized) {
            runCatching { unityBanner.load() }
        } else {
            pendingUnityBanners.add(WeakReference(unityBanner))
        }
    }

    /**
     * Creates a banner container that loads Unity Banner directly in Release builds without custom AdMob IDs,
     * or loads AdMob Adaptive Banner first and falls back to Unity BannerView if AdMob fails to fill.
     */
    fun createBannerContainerWithFallback(
        activity: Activity,
        widthDp: Int,
        personalizedAdsEnabled: Boolean
    ): FrameLayout {
        val container = FrameLayout(activity)
        if (!_canRequestAds.value) return container

        initializeUnityAds(activity.applicationContext)

        if (preferUnityDirectly(bannerAdUnitId)) {
            attachUnityBanner(activity, container)
            return container
        }

        val adView = createAdaptiveBannerView(activity, widthDp, personalizedAdsEnabled)
        adView.adListener = object : AdListener() {
            override fun onAdLoaded() {
                FirebaseSyncManager.logEvent(activity, "ad_banner_loaded", mapOf("network" to "admob"))
            }

            override fun onAdFailedToLoad(error: LoadAdError) {
                runOnMain {
                    attachUnityBanner(activity, container)
                }
            }
        }
        val params = FrameLayout.LayoutParams(
            FrameLayout.LayoutParams.WRAP_CONTENT,
            FrameLayout.LayoutParams.WRAP_CONTENT,
            Gravity.CENTER_HORIZONTAL
        )
        container.addView(adView, params)
        return container
    }

    fun preloadInterstitial(context: Context, personalizedAdsEnabled: Boolean = false) {
        if (!_canRequestAds.value) return
        initializeUnityAds(context.applicationContext)
        preloadUnityInterstitial()
        if (preferUnityDirectly(interstitialAdUnitId)) return

        InterstitialAd.load(
            context,
            interstitialAdUnitId,
            buildAdRequest(personalizedAdsEnabled),
            object : InterstitialAdLoadCallback() {
                override fun onAdLoaded(ad: InterstitialAd) {
                    runOnMain { interstitialAd = ad }
                }

                override fun onAdFailedToLoad(error: LoadAdError) {
                    runOnMain {
                        interstitialAd = null
                        preloadUnityInterstitial()
                    }
                }
            }
        )
    }

    /**
     * Strictly gated: ONLY call after test completion summary or non-study navigation transitions,
     * NEVER while a student is solving a question or inside an active Focus Session.
     */
    fun showInterstitialIfReady(
        activity: Activity,
        isTestOrFocusActive: Boolean,
        onDismissed: () -> Unit = {}
    ) {
        val now = System.currentTimeMillis()
        if (isTestOrFocusActive ||
            !_canRequestAds.value ||
            (now - lastInterstitialShownMs) < MIN_INTERSTITIAL_INTERVAL_MS
        ) {
            runOnMain(onDismissed)
            return
        }

        val ad = interstitialAd
        if (ad != null && !preferUnityDirectly(interstitialAdUnitId)) {
            ad.fullScreenContentCallback = object : FullScreenContentCallback() {
                override fun onAdDismissedFullScreenContent() {
                    runOnMain {
                        interstitialAd = null
                        lastInterstitialShownMs = System.currentTimeMillis()
                        preloadInterstitial(activity.applicationContext)
                        FirebaseSyncManager.logEvent(activity, "ad_interstitial_shown", mapOf("network" to "admob"))
                        onDismissed()
                    }
                }

                override fun onAdFailedToShowFullScreenContent(error: AdError) {
                    runOnMain {
                        interstitialAd = null
                        preloadUnityInterstitial()
                        onDismissed()
                    }
                }
            }
            ad.show(activity)
            return
        }

        if (unityInterstitialReady && (unityInitComplete || UnityAds.isInitialized)) {
            UnityAds.show(
                activity,
                UNITY_INTERSTITIAL_PLACEMENT,
                UnityAdsShowOptions(),
                object : IUnityAdsShowListener {
                    override fun onUnityAdsShowFailure(
                        placementId: String?,
                        error: UnityAds.UnityAdsShowError?,
                        message: String?
                    ) {
                        runOnMain {
                            unityInterstitialReady = false
                            preloadUnityInterstitial()
                            onDismissed()
                        }
                    }

                    override fun onUnityAdsShowStart(placementId: String?) {}
                    override fun onUnityAdsShowClick(placementId: String?) {}
                    override fun onUnityAdsShowComplete(
                        placementId: String?,
                        state: UnityAds.UnityAdsShowCompletionState?
                    ) {
                        runOnMain {
                            unityInterstitialReady = false
                            lastInterstitialShownMs = System.currentTimeMillis()
                            preloadUnityInterstitial()
                            FirebaseSyncManager.logEvent(activity, "ad_interstitial_shown", mapOf("network" to "unity"))
                            onDismissed()
                        }
                    }
                }
            )
            return
        }

        preloadInterstitial(activity.applicationContext)
        preloadUnityInterstitial()
        runOnMain(onDismissed)
    }

    fun preloadRewarded(context: Context, personalizedAdsEnabled: Boolean = false) {
        if (!_canRequestAds.value) return
        initializeUnityAds(context.applicationContext)
        preloadUnityRewarded()
        if (preferUnityDirectly(rewardedAdUnitId)) return

        RewardedAd.load(
            context,
            rewardedAdUnitId,
            buildAdRequest(personalizedAdsEnabled),
            object : RewardedAdLoadCallback() {
                override fun onAdLoaded(ad: RewardedAd) {
                    runOnMain { rewardedAd = ad }
                }

                override fun onAdFailedToLoad(error: LoadAdError) {
                    runOnMain {
                        rewardedAd = null
                        preloadUnityRewarded()
                    }
                }
            }
        )
    }

    fun showRewardedAd(
        activity: Activity,
        onRewardEarned: () -> Unit,
        onUnavailable: () -> Unit
    ) {
        if (!_canRequestAds.value) {
            runOnMain(onUnavailable)
            return
        }

        val ad = rewardedAd
        if (ad != null && !preferUnityDirectly(rewardedAdUnitId)) {
            var rewarded = false
            ad.fullScreenContentCallback = object : FullScreenContentCallback() {
                override fun onAdDismissedFullScreenContent() {
                    runOnMain {
                        rewardedAd = null
                        preloadRewarded(activity.applicationContext)
                        if (!rewarded) {
                            onUnavailable()
                        }
                    }
                }

                override fun onAdFailedToShowFullScreenContent(error: AdError) {
                    runOnMain {
                        rewardedAd = null
                        preloadUnityRewarded()
                        onUnavailable()
                    }
                }
            }
            ad.show(activity) { _ ->
                rewarded = true
                runOnMain {
                    FirebaseSyncManager.logEvent(activity, "ad_reward_earned", mapOf("network" to "admob"))
                    onRewardEarned()
                }
            }
            return
        }

        if (unityRewardedReady && (unityInitComplete || UnityAds.isInitialized)) {
            UnityAds.show(
                activity,
                UNITY_REWARDED_PLACEMENT,
                UnityAdsShowOptions(),
                object : IUnityAdsShowListener {
                    override fun onUnityAdsShowFailure(
                        placementId: String?,
                        error: UnityAds.UnityAdsShowError?,
                        message: String?
                    ) {
                        runOnMain {
                            unityRewardedReady = false
                            preloadUnityRewarded()
                            onUnavailable()
                        }
                    }

                    override fun onUnityAdsShowStart(placementId: String?) {}
                    override fun onUnityAdsShowClick(placementId: String?) {}
                    override fun onUnityAdsShowComplete(
                        placementId: String?,
                        state: UnityAds.UnityAdsShowCompletionState?
                    ) {
                        runOnMain {
                            unityRewardedReady = false
                            preloadUnityRewarded()
                            if (state == UnityAds.UnityAdsShowCompletionState.COMPLETED) {
                                FirebaseSyncManager.logEvent(activity, "ad_reward_earned", mapOf("network" to "unity"))
                                onRewardEarned()
                            } else {
                                onUnavailable()
                            }
                        }
                    }
                }
            )
            return
        }

        initializeUnityAds(activity.applicationContext)
        preloadRewarded(activity.applicationContext)
        preloadUnityRewarded()
        runOnMain(onUnavailable)
    }
}
