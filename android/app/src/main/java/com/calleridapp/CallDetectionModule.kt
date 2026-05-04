package com.calleridapp

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import android.provider.CallLog
import android.telephony.PhoneStateListener
import android.telephony.TelephonyCallback
import android.telephony.TelephonyManager
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableNativeArray
import com.facebook.react.bridge.WritableNativeMap
import com.facebook.react.modules.core.DeviceEventManagerModule

class CallDetectionModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    private var telephonyManager: TelephonyManager? = null
    private var wasRinging = false
    private var wasOffHook = false

    private var telephonyCallback: TelephonyCallback? = null

    @Suppress("DEPRECATION")
    private var phoneStateListener: PhoneStateListener? = null

    override fun getName() = "CallDetectionManagerAndroid"

    // ── Call log ─────────────────────────────────────────────────────────────

    @ReactMethod
    fun getCallLog(limit: Int, promise: Promise) {
        val hasPermission = ContextCompat.checkSelfPermission(
            reactContext, Manifest.permission.READ_CALL_LOG
        ) == PackageManager.PERMISSION_GRANTED

        if (!hasPermission) {
            promise.reject("PERMISSION_DENIED", "READ_CALL_LOG não concedido")
            return
        }

        try {
            val results = WritableNativeArray()
            val cursor = reactContext.contentResolver.query(
                CallLog.Calls.CONTENT_URI,
                arrayOf(
                    CallLog.Calls.NUMBER,
                    CallLog.Calls.DATE,
                    CallLog.Calls.DURATION,
                    CallLog.Calls.TYPE,
                ),
                "${CallLog.Calls.TYPE} IN (${CallLog.Calls.INCOMING_TYPE}, ${CallLog.Calls.MISSED_TYPE})",
                null,
                "${CallLog.Calls.DATE} DESC"
            )

            var count = 0
            cursor?.use {
                while (it.moveToNext() && count < limit) {
                    val map = WritableNativeMap()
                    map.putString("number",    it.getString(0) ?: "")
                    map.putDouble("timestamp", it.getLong(1).toDouble())
                    map.putInt("duration",     it.getInt(2))
                    map.putInt("type",         it.getInt(3))
                    results.pushMap(map)
                    count++
                }
            }

            promise.resolve(results)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message ?: "Erro ao ler call log")
        }
    }

    // ── Listener ─────────────────────────────────────────────────────────────

    @ReactMethod
    fun startListener() {
        val granted = ContextCompat.checkSelfPermission(
            reactContext, Manifest.permission.READ_PHONE_STATE
        ) == PackageManager.PERMISSION_GRANTED

        if (!granted) { emit("PermissionDenied", ""); return }

        telephonyManager = reactContext
            .getSystemService(Context.TELEPHONY_SERVICE) as TelephonyManager

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            startWithTelephonyCallback()
        } else {
            @Suppress("DEPRECATION")
            startWithPhoneStateListener()
        }
    }

    @androidx.annotation.RequiresApi(Build.VERSION_CODES.S)
    private fun startWithTelephonyCallback() {
        telephonyCallback = object : TelephonyCallback(), TelephonyCallback.CallStateListener {
            override fun onCallStateChanged(state: Int) {
                handleState(state, getLastIncomingNumber())
            }
        }
        telephonyManager?.registerTelephonyCallback(
            reactContext.mainExecutor, telephonyCallback!!
        )
    }

    @Suppress("DEPRECATION")
    private fun startWithPhoneStateListener() {
        phoneStateListener = object : PhoneStateListener() {
            @Suppress("OVERRIDE_DEPRECATION")
            override fun onCallStateChanged(state: Int, phoneNumber: String?) {
                handleState(state, phoneNumber ?: "")
            }
        }
        telephonyManager?.listen(phoneStateListener, PhoneStateListener.LISTEN_CALL_STATE)
    }

    private fun handleState(state: Int, number: String) {
        when (state) {
            TelephonyManager.CALL_STATE_RINGING -> { wasRinging = true;  emit("Incoming", number) }
            TelephonyManager.CALL_STATE_OFFHOOK -> { wasOffHook = true;  emit("Offhook",  number) }
            TelephonyManager.CALL_STATE_IDLE    -> {
                when {
                    wasOffHook -> emit("Disconnected", number)
                    wasRinging -> emit("Missed",       number)
                }
                wasRinging = false; wasOffHook = false
            }
        }
    }

    @ReactMethod
    fun stopListener() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            telephonyCallback?.let { telephonyManager?.unregisterTelephonyCallback(it) }
            telephonyCallback = null
        } else {
            @Suppress("DEPRECATION")
            telephonyManager?.listen(phoneStateListener, PhoneStateListener.LISTEN_NONE)
            phoneStateListener = null
        }
        telephonyManager = null
        wasRinging = false; wasOffHook = false
    }

    private fun getLastIncomingNumber(): String {
        val ok = ContextCompat.checkSelfPermission(
            reactContext, Manifest.permission.READ_CALL_LOG
        ) == PackageManager.PERMISSION_GRANTED
        if (!ok) return ""
        return try {
            reactContext.contentResolver.query(
                CallLog.Calls.CONTENT_URI,
                arrayOf(CallLog.Calls.NUMBER),
                "${CallLog.Calls.TYPE} = ${CallLog.Calls.INCOMING_TYPE}",
                null,
                "${CallLog.Calls.DATE} DESC"
            )?.use { if (it.moveToFirst()) it.getString(0) else "" } ?: ""
        } catch (_: Exception) { "" }
    }

    @ReactMethod fun addListener(eventName: String) {}
    @ReactMethod fun removeListeners(count: Int) {}

    private fun emit(state: String, phoneNumber: String) {
        reactContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit("CallDetectionEvent", "$state|$phoneNumber")
    }
}
