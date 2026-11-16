plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.compose)
    alias(libs.plugins.ksp)
}

android {
    namespace = "com.jee.studyguardian"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.jee.studyguardian"
        minSdk = 26
        targetSdk = 35
        versionCode = 1
        versionName = "1.0.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        vectorDrawables {
            useSupportLibrary = true
        }

        val aiBackendUrl = project.findProperty("AI_BACKEND_URL")?.toString()
            ?: System.getenv("AI_BACKEND_URL")
            ?: ""
        buildConfigField("String", "DEFAULT_AI_BACKEND_URL", "\"$aiBackendUrl\"")

        // Official Google AdMob Test App ID for debug builds; override via gradle/env for production
        val admobAppId = project.findProperty("ADMOB_APP_ID")?.toString()
            ?: System.getenv("ADMOB_APP_ID")
            ?: "ca-app-pub-3940256099942544~3347511713"
        manifestPlaceholders["admobAppId"] = admobAppId

        val bannerUnitId = project.findProperty("ADMOB_BANNER_ID")?.toString()
            ?: System.getenv("ADMOB_BANNER_ID")
            ?: "ca-app-pub-3940256099942544/9214589741"
        val interstitialUnitId = project.findProperty("ADMOB_INTERSTITIAL_ID")?.toString()
            ?: System.getenv("ADMOB_INTERSTITIAL_ID")
            ?: "ca-app-pub-3940256099942544/1033173712"
        val rewardedUnitId = project.findProperty("ADMOB_REWARDED_ID")?.toString()
            ?: System.getenv("ADMOB_REWARDED_ID")
            ?: "ca-app-pub-3940256099942544/5224354917"
        val nativeUnitId = project.findProperty("ADMOB_NATIVE_ID")?.toString()
            ?: System.getenv("ADMOB_NATIVE_ID")
            ?: "ca-app-pub-3940256099942544/2247696110"

        buildConfigField("String", "ADMOB_BANNER_ID", "\"$bannerUnitId\"")
        buildConfigField("String", "ADMOB_INTERSTITIAL_ID", "\"$interstitialUnitId\"")
        buildConfigField("String", "ADMOB_REWARDED_ID", "\"$rewardedUnitId\"")
        buildConfigField("String", "ADMOB_NATIVE_ID", "\"$nativeUnitId\"")
    }

    signingConfigs {
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
            applicationIdSuffix = ".debug"
            isMinifyEnabled = false
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
            }
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
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
    implementation(libs.okhttp)

    implementation(libs.play.services.ads)
    implementation(libs.user.messaging.platform)

    testImplementation(libs.junit)
    testImplementation(libs.kotlinx.coroutines.test)
    androidTestImplementation(libs.androidx.junit)
    androidTestImplementation(libs.androidx.espresso.core)
    debugImplementation(libs.androidx.ui.tooling)
    debugImplementation(libs.androidx.ui.test.manifest)
}
