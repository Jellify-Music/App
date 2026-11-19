# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# Add any project specific keep options here:


-keep class com.jellify.BuildConfig { *; }

# Room (pulled in by WorkManager) instantiates generated *_Impl databases reflectively.
# Room < 2.7 ships `-keep class * extends RoomDatabase` without members, which under R8
# full mode + optimization strips the no-arg constructor and crashes WorkManager init.
-keep class * extends androidx.room.RoomDatabase { void <init>(); }

# Nitro hybrid objects are only constructed from JNI. RN's `-keep @DoNotStrip class *` keeps the
# class but not its constructor, so R8 assumes it's never instantiated and drops field initializers
# (e.g. NitroOta's `by lazy` delegate), causing NPEs at runtime.
-keep class * extends com.margelo.nitro.core.HybridObject { <init>(...); }
