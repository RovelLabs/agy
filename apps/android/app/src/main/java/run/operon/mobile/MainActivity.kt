package run.operon.mobile

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.webkit.JavascriptInterface
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        webView = WebView(this)
        setContentView(webView)

        configureWebView()
        handleIncomingIntent(intent)
    }

    override fun onNewIntent(intent: Intent?) {
        super.onNewIntent(intent)
        intent?.let { handleIncomingIntent(it) }
    }

    private fun configureWebView() {
        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            allowFileAccess = true
            cacheMode = WebSettings.LOAD_DEFAULT
        }

        webView.webViewClient = object : WebViewClient() {
            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
                // Injected platform identifier
                webView.evaluateJavascript("window.OPERON_MOBILE_PLATFORM = 'android';", null)
            }
        }

        // Register Native Android Bridge for JavaScript
        webView.addJavascriptInterface(OperonAndroidBridge(this), "AndroidBridge")

        // Load local asset or embedded bundle
        webView.loadUrl("file:///android_asset/hud/index.html")
    }

    private fun handleIncomingIntent(intent: Intent) {
        if (intent.action == Intent.ACTION_VIEW) {
            val uri: Uri? = intent.data
            if (uri != null && uri.scheme == "operon" && uri.host == "run") {
                val recipeId = uri.lastPathSegment ?: ""
                webView.evaluateJavascript("window.operonApp?.executeRecipeById('$recipeId');", null)
            }
        }
    }

    inner class OperonAndroidBridge(private val context: Context) {
        @JavascriptInterface
        fun readClipboard(): String {
            val cm = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
            return cm.primaryClip?.getItemAt(0)?.text?.toString() ?: ""
        }

        @JavascriptInterface
        fun writeClipboard(text: String) {
            val cm = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
            val clip = ClipData.newPlainText("Operon", text)
            cm.setPrimaryClip(clip)
            runOnUiThread {
                Toast.makeText(context, "Copied to Clipboard", Toast.LENGTH_SHORT).show()
            }
        }

        @JavascriptInterface
        fun showNotification(title: String, message: String) {
            try {
                val builder = NotificationCompat.Builder(context, "operon_default")
                    .setSmallIcon(android.R.drawable.ic_dialog_info)
                    .setContentTitle(title)
                    .setContentText(message)
                    .setPriority(NotificationCompat.PRIORITY_DEFAULT)
                    .setAutoCancel(true)

                with(NotificationManagerCompat.from(context)) {
                    notify(System.currentTimeMillis().toInt(), builder.build())
                }
            } catch (e: SecurityException) {
                runOnUiThread {
                    Toast.makeText(context, "$title: $message", Toast.LENGTH_SHORT).show()
                }
            }
        }

        @JavascriptInterface
        fun shareContent(text: String) {
            val sendIntent = Intent().apply {
                action = Intent.ACTION_SEND
                putExtra(Intent.EXTRA_TEXT, text)
                type = "text/plain"
            }
            context.startActivity(Intent.createChooser(sendIntent, "Share via Operon"))
        }
    }
}
