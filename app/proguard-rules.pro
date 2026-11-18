# Android Manifest Components & App Entry
-keep class com.jee.studyguardian.application.JeeStudyGuardianApp { *; }
-keep class com.jee.studyguardian.ui.MainActivity { *; }
-keep class com.jee.studyguardian.ui.screens.BlockOverlayActivity { *; }
-keep class com.jee.studyguardian.blocker.FocusGuardianForegroundService { *; }
-keep class com.jee.studyguardian.blocker.BootReceiver { *; }
-keep class com.jee.studyguardian.planner.StudyAlarmReceiver { *; }

# ViewModels & WorkManager Reflection Constructors
-keep class * extends androidx.lifecycle.ViewModel {
    public <init>(...);
}
-keep class * extends androidx.work.ListenableWorker {
    public <init>(android.content.Context, androidx.work.WorkerParameters);
}
-keep class com.jee.studyguardian.viewmodel.** { *; }
-keep class com.jee.studyguardian.planner.** { *; }

# Room, App Models, DataStore & Coroutines
-keep class * extends androidx.room.RoomDatabase
-keep @androidx.room.Entity class *
-keep class * extends androidx.datastore.preferences.protobuf.GeneratedMessageLite { *; }
-keep class com.jee.studyguardian.models.** { *; }
-keep enum com.jee.studyguardian.models.** { *; }
-keep class com.jee.studyguardian.database.** { *; }
-keep class com.jee.studyguardian.data.** { *; }
-keep class com.jee.studyguardian.repository.** { *; }
-keep class com.jee.studyguardian.firebase.** { *; }
-keep class com.jee.studyguardian.ai.** { *; }
-keep class com.jee.studyguardian.filters.** { *; }
-keep class com.jee.studyguardian.security.** { *; }
-keep class com.jee.studyguardian.ads.** { *; }
-keepclassmembers class * extends java.lang.Enum {
    public static **[] values();
    public static ** valueOf(java.lang.String);
}
-dontwarn androidx.room.paging.**
-dontwarn androidx.datastore.**
-dontwarn kotlinx.coroutines.**

# Firebase & Google Play Services Auth
-keepattributes Signature,InnerClasses,EnclosingMethod,Exceptions,*Annotation*
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
