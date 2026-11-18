# Room, App Models & Coroutines
-keep class * extends androidx.room.RoomDatabase
-keep @androidx.room.Entity class *
-keep class com.jee.studyguardian.models.** { *; }
-keep class com.jee.studyguardian.database.** { *; }
-keep class com.jee.studyguardian.firebase.** { *; }
-dontwarn androidx.room.paging.**

# Firebase & Google Play Services Auth
-keepattributes Signature
-keepattributes *Annotation*
-keep class com.google.firebase.** { *; }
-keep class com.google.android.gms.auth.** { *; }
-dontwarn com.google.firebase.**
-dontwarn com.google.android.gms.**

# OkHttp
-dontwarn okhttp3.**
-dontwarn okio.**

# Google Mobile Ads, Mediation & UMP
-keep class com.google.android.gms.ads.** { *; }
-keep class com.google.ads.mediation.** { *; }
-keep class com.google.android.ump.** { *; }

# Unity Ads SDK
-keep class com.unity3d.** { *; }
-dontwarn com.unity3d.**

# AndroidX Biometric
-keep class androidx.biometric.** { *; }
