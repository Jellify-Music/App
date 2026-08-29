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

# KNOWN GAP: these rules are thin for an app with this many native modules, and R8
# is demonstrably breaking at least one reflective call. A release build logs:
#
#   RNInstallReferrerClient exception. getInstallReferrer will be unavailable:
#   java.lang.NoSuchMethodException: R2.a.newBuilder [class android.content.Context]
#
# "R2.a" is an R8-obfuscated name, so the Install Referrer client is looking up a
# method on a class R8 has renamed. That one is caught and non-fatal, but it shows
# reflective access is not protected here in general.
#
# Classes referenced only from AndroidManifest metadata strings are the highest risk,
# since R8 sees no code reference and may strip or rename them. One example present in
# this app is nitro-player's Cast provider, declared in its library manifest as
# com.google.android.gms.cast.framework.OPTIONS_PROVIDER_CLASS_NAME =
# com.margelo.nitro.nitroplayer.media.NitroCastOptionsProvider. It has not been
# observed failing, but it fits the pattern and would only break in release builds.
#
# To test whether R8 is implicated in any future release-only crash, flip
# enableProguardInReleaseBuilds to false in build.gradle and rebuild. If the crash
# disappears, add keep rules rather than leaving minification off.
