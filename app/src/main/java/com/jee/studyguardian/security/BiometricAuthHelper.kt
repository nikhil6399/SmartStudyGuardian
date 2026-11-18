package com.jee.studyguardian.security

import android.content.Context
import android.os.Build
import androidx.biometric.BiometricManager
import androidx.biometric.BiometricPrompt
import androidx.core.content.ContextCompat
import androidx.fragment.app.FragmentActivity

object BiometricAuthHelper {

    private val allowedAuthenticators: Int
        get() = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            BiometricManager.Authenticators.BIOMETRIC_STRONG or
                BiometricManager.Authenticators.BIOMETRIC_WEAK or
                BiometricManager.Authenticators.DEVICE_CREDENTIAL
        } else {
            BiometricManager.Authenticators.BIOMETRIC_WEAK or
                BiometricManager.Authenticators.DEVICE_CREDENTIAL
        }

    fun canAuthenticate(context: Context): Boolean {
        return runCatching {
            val manager = BiometricManager.from(context)
            manager.canAuthenticate(allowedAuthenticators) == BiometricManager.BIOMETRIC_SUCCESS
        }.getOrDefault(false)
    }

    fun authenticate(
        activity: FragmentActivity,
        title: String = "Unlock AI Study Guardian",
        subtitle: String = "Use your fingerprint or device lock to continue",
        onSuccess: () -> Unit,
        onError: (String) -> Unit
    ) {
        if (!canAuthenticate(activity)) {
            onError("Fingerprint or screen lock is not configured on this device.")
            return
        }
        runCatching {
            val executor = ContextCompat.getMainExecutor(activity)
            val prompt = BiometricPrompt(
                activity,
                executor,
                object : BiometricPrompt.AuthenticationCallback() {
                    override fun onAuthenticationSucceeded(result: BiometricPrompt.AuthenticationResult) {
                        super.onAuthenticationSucceeded(result)
                        onSuccess()
                    }

                    override fun onAuthenticationError(errorCode: Int, errString: CharSequence) {
                        super.onAuthenticationError(errorCode, errString)
                        onError(errString.toString())
                    }

                    override fun onAuthenticationFailed() {
                        super.onAuthenticationFailed()
                        onError("Fingerprint not recognized. Try again.")
                    }
                }
            )

            val promptInfo = BiometricPrompt.PromptInfo.Builder()
                .setTitle(title)
                .setSubtitle(subtitle)
                .setAllowedAuthenticators(allowedAuthenticators)
                .build()

            prompt.authenticate(promptInfo)
        }.onFailure { err ->
            onError(err.localizedMessage ?: "Biometric authentication unavailable.")
        }
    }
}
