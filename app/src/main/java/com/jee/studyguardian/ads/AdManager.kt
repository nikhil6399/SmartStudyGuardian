package com.jee.studyguardian.ads

import android.app.Activity
import android.content.Context
import com.google.android.gms.ads.AdError
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
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

/**
 * Centralized Google AdMob Manager.
 * - Uses official Google Test Ad Unit IDs in debug / default builds.
 * - Enforces age-appropriate ad treatment (TAG_FOR_UNDER_AGE_OF_CONSENT & MAX_AD_CONTENT_RATING_T).
 * - Never forces interstitials during mock tests, active question solving, or active focus sessions.
 * - Integrates Google UMP Consent SDK for GDPR / regional privacy compliance.
 */
object AdManager {

    private var isMobileAdsInitialized = false
    private var interstitialAd: InterstitialAd? = null
    private var rewardedAd: RewardedAd? = null

    private val _consentRequired = MutableStateFlow(false)
    val consentRequired: StateFlow<Boolean> = _consentRequired.asStateFlow()

    private val _canRequestAds = MutableStateFlow(true)
    val canRequestAds: StateFlow<Boolean> = _canRequestAds.asStateFlow()

    val bannerAdUnitId: String
        get() = if (BuildConfig.DEBUG) "ca-app-pub-3940256099942544/9214589741" else BuildConfig.ADMOB_BANNER_ID

    val interstitialAdUnitId: String
        get() = if (BuildConfig.DEBUG) "ca-app-pub-3940256099942544/1033173712" else BuildConfig.ADMOB_INTERSTITIAL_ID

    val rewardedAdUnitId: String
        get() = if (BuildConfig.DEBUG) "ca-app-pub-3940256099942544/5224354917" else BuildConfig.ADMOB_REWARDED_ID

    val nativeAdUnitId: String
        get() = if (BuildConfig.DEBUG) "ca-app-pub-3940256099942544/2247696110" else BuildConfig.ADMOB_NATIVE_ID

    fun configureAgeAppropriateRequestConfig(underAgeSafe: Boolean = true) {
        val builder = RequestConfiguration.Builder()
            .setMaxAdContentRating(RequestConfiguration.MAX_AD_CONTENT_RATING_T)
        if (underAgeSafe) {
            builder.setTagForUnderAgeOfConsent(RequestConfiguration.TAG_FOR_UNDER_AGE_OF_CONSENT_TRUE)
        } else {
            builder.setTagForUnderAgeOfConsent(RequestConfiguration.TAG_FOR_UNDER_AGE_OF_CONSENT_UNSPECIFIED)
        }
        MobileAds.setRequestConfiguration(builder.build())
    }

    fun gatherConsentAndInitialize(activity: Activity, underAgeSafe: Boolean = true) {
        configureAgeAppropriateRequestConfig(underAgeSafe)

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
                // On offline/consent fetch error, initialize safely if previously allowed
                if (consentInfo.canRequestAds()) {
                    initializeMobileAds(activity.applicationContext)
                }
            }
        )

        if (consentInfo.canRequestAds()) {
            initializeMobileAds(activity.applicationContext)
        }
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
            preloadInterstitial(context)
            preloadRewarded(context)
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

    fun preloadInterstitial(context: Context, personalizedAdsEnabled: Boolean = false) {
        if (!_canRequestAds.value) return
        InterstitialAd.load(
            context,
            interstitialAdUnitId,
            buildAdRequest(personalizedAdsEnabled),
            object : InterstitialAdLoadCallback() {
                override fun onAdLoaded(ad: InterstitialAd) {
                    interstitialAd = ad
                }

                override fun onAdFailedToLoad(error: LoadAdError) {
                    interstitialAd = null
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
        if (isTestOrFocusActive || !_canRequestAds.value) {
            onDismissed()
            return
        }
        val ad = interstitialAd
        if (ad == null) {
            onDismissed()
            return
        }
        ad.fullScreenContentCallback = object : FullScreenContentCallback() {
            override fun onAdDismissedFullScreenContent() {
                interstitialAd = null
                preloadInterstitial(activity.applicationContext)
                onDismissed()
            }

            override fun onAdFailedToShowFullScreenContent(error: AdError) {
                interstitialAd = null
                onDismissed()
            }
        }
        ad.show(activity)
    }

    fun preloadRewarded(context: Context, personalizedAdsEnabled: Boolean = false) {
        if (!_canRequestAds.value) return
        RewardedAd.load(
            context,
            rewardedAdUnitId,
            buildAdRequest(personalizedAdsEnabled),
            object : RewardedAdLoadCallback() {
                override fun onAdLoaded(ad: RewardedAd) {
                    rewardedAd = ad
                }

                override fun onAdFailedToLoad(error: LoadAdError) {
                    rewardedAd = null
                }
            }
        )
    }

    fun showRewardedAd(
        activity: Activity,
        onRewardEarned: () -> Unit,
        onUnavailable: () -> Unit
    ) {
        val ad = rewardedAd
        if (ad == null || !_canRequestAds.value) {
            onUnavailable()
            return
        }
        ad.fullScreenContentCallback = object : FullScreenContentCallback() {
            override fun onAdDismissedFullScreenContent() {
                rewardedAd = null
                preloadRewarded(activity.applicationContext)
            }
        }
        ad.show(activity) { _ ->
            onRewardEarned()
        }
    }
}
