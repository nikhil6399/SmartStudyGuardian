import org.jetbrains.kotlin.gradle.dsl.JvmTarget

plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.compose)
    alias(libs.plugins.ksp)
    alias(libs.plugins.google.services)
}

android {
    namespace = "com.jee.studyguardian"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.studyguardian.ai"
        minSdk = 26
        targetSdk = 35
        versionCode = 1
        versionName = "1.0.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        vectorDrawables {
            useSupportLibrary = true
        }

        fun envOrProp(key: String, fallback: String): String {
            val fromProp = project.findProperty(key)?.toString()?.trim()
            if (!fromProp.isNullOrEmpty()) return fromProp
            val fromEnv = System.getenv(key)?.trim()
            if (!fromEnv.isNullOrEmpty()) return fromEnv
            return fallback
        }

        val aiBackendUrl = envOrProp("AI_BACKEND_URL", "")
        buildConfigField("String", "DEFAULT_AI_BACKEND_URL", "\"$aiBackendUrl\"")

        // Official Google AdMob Test App ID fallback; override via gradle/env for production
        val rawAdmobAppId = envOrProp("ADMOB_APP_ID", "ca-app-pub-3940256099942544~3347511713")
        val admobAppId = if (rawAdmobAppId.contains("~")) {
            rawAdmobAppId
        } else {
            "ca-app-pub-3940256099942544~3347511713"
        }
        manifestPlaceholders["admobAppId"] = admobAppId

        val bannerUnitId = envOrProp("ADMOB_BANNER_ID", "ca-app-pub-3940256099942544/9214589741")
        val interstitialUnitId = envOrProp("ADMOB_INTERSTITIAL_ID", "ca-app-pub-3940256099942544/1033173712")
        val rewardedUnitId = envOrProp("ADMOB_REWARDED_ID", "ca-app-pub-3940256099942544/5224354917")
        val nativeUnitId = envOrProp("ADMOB_NATIVE_ID", "ca-app-pub-3940256099942544/2247696110")

        buildConfigField("String", "ADMOB_BANNER_ID", "\"$bannerUnitId\"")
        buildConfigField("String", "ADMOB_INTERSTITIAL_ID", "\"$interstitialUnitId\"")
        buildConfigField("String", "ADMOB_REWARDED_ID", "\"$rewardedUnitId\"")
        buildConfigField("String", "ADMOB_NATIVE_ID", "\"$nativeUnitId\"")

        val unityGameId = envOrProp("UNITY_GAME_ID", "800441454")
        buildConfigField("String", "UNITY_GAME_ID", "\"$unityGameId\"")

        val webClientId = envOrProp(
            "WEB_CLIENT_ID",
            "237357970564-20fegsf1ehp070mbi5v4kam19jo2gnh1.apps.googleusercontent.com"
        )
        buildConfigField("String", "WEB_CLIENT_ID", "\"$webClientId\"")
    }

    signingConfigs {
        getByName("debug") {
            val debugKs = file("debug.keystore")
            if (debugKs.exists()) {
                storeFile = debugKs
                storePassword = "android"
                keyAlias = "androiddebugkey"
                keyPassword = "android"
            }
        }
        create("release") {
            val keystorePath = System.getenv("ANDROID_KEYSTORE_PATH")
            if (!keystorePath.isNullOrBlank()) {
                storeFile = file(keystorePath)
                storePassword = System.getenv("KEYSTORE_PASSWORD") ?: ""
                keyAlias = System.getenv("KEY_ALIAS") ?: ""
                keyPassword = System.getenv("KEY_PASSWORD") ?: ""
            }
        }
    }

    buildTypes {
        debug {
            isMinifyEnabled = false
            val debugKs = file("debug.keystore")
            if (debugKs.exists()) {
                signingConfig = signingConfigs.getByName("debug")
            }
        }
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
            val hasSigning = !System.getenv("ANDROID_KEYSTORE_PATH").isNullOrBlank()
            if (hasSigning) {
                signingConfig = signingConfigs.getByName("release")
            } else {
                val debugKs = file("debug.keystore")
                if (debugKs.exists()) {
                    signingConfig = signingConfigs.getByName("debug")
                }
            }
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    buildFeatures {
        compose = true
        buildConfig = true
    }

    packaging {
        resources {
            excludes += "/META-INF/{AL2.0,LGPL2.1}"
        }
    }

    testOptions {
        unitTests.isReturnDefaultValues = true
    }

    lint {
        abortOnError = false
        checkReleaseBuilds = false
    }
}

kotlin {
    compilerOptions {
        jvmTarget.set(JvmTarget.JVM_17)
    }
}

ksp {
    arg("room.schemaLocation", "$projectDir/schemas")
}

dependencies {
    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.lifecycle.runtime.ktx)
    implementation(libs.androidx.lifecycle.viewmodel.compose)
    implementation(libs.androidx.activity.compose)
    implementation(platform(libs.androidx.compose.bom))
    implementation(libs.androidx.ui)
    implementation(libs.androidx.ui.graphics)
    implementation(libs.androidx.ui.tooling.preview)
    implementation(libs.androidx.material3)
    implementation(libs.androidx.material.icons.extended)
    implementation(libs.androidx.navigation.compose)

    implementation(libs.androidx.room.runtime)
    implementation(libs.androidx.room.ktx)
    ksp(libs.androidx.room.compiler)

    implementation(libs.androidx.datastore.preferences)
    implementation(libs.androidx.work.runtime.ktx)
    implementation(libs.kotlinx.coroutines.android)
    implementation(libs.kotlinx.coroutines.play.services)
    implementation(libs.okhttp)

    implementation(libs.play.services.ads)
    implementation(libs.play.services.auth)
    implementation(libs.unity.ads)
    implementation(libs.user.messaging.platform)
    implementation(libs.androidx.biometric)

    implementation(platform(libs.firebase.bom))
    implementation(libs.firebase.auth)
    implementation(libs.firebase.firestore)
    implementation(libs.firebase.analytics)

    testImplementation(libs.junit)
    testImplementation(libs.kotlinx.coroutines.test)
    androidTestImplementation(libs.androidx.junit)
    androidTestImplementation(libs.androidx.espresso.core)
    debugImplementation(libs.androidx.ui.tooling)
    debugImplementation(libs.androidx.ui.test.manifest)
}
