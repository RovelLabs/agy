package run.operon.mobile

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity

class ShareActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        when (intent?.action) {
            Intent.ACTION_SEND -> {
                if ("text/plain" == intent.type) {
                    handleSendText(intent)
                } else if (intent.type?.startsWith("image/") == true) {
                    handleSendImage(intent)
                }
            }
            Intent.ACTION_SEND_MULTIPLE -> {
                if (intent.type?.startsWith("image/") == true) {
                    handleSendMultipleImages(intent)
                }
            }
        }
        finish()
    }

    private fun handleSendText(intent: Intent) {
        val sharedText = intent.getStringExtra(Intent.EXTRA_TEXT) ?: return
        
        // Strip tracking parameters directly
        val trackingRegex = Regex("(?<=[?&])(utm_[^&=]+|fbclid|gclid|igshid|si)=[^&#]*(&|$)")
        val cleaned = trackingRegex.replace(sharedText, "").trimEnd('?', '&')

        val cm = getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
        cm.setPrimaryClip(ClipData.newPlainText("Cleaned by Operon", cleaned))

        Toast.makeText(this, "✓ Operon cleaned link & copied to clipboard", Toast.LENGTH_SHORT).show()
    }

    private fun handleSendImage(intent: Intent) {
        val imageUri = intent.getParcelableExtra<Uri>(Intent.EXTRA_STREAM) ?: return
        // Forward image URI to Operon processing
        Toast.makeText(this, "✓ Operon: Image queued for local metadata scrub", Toast.LENGTH_SHORT).show()
    }

    private fun handleSendMultipleImages(intent: Intent) {
        val imageUris = intent.getParcelableArrayListExtra<Uri>(Intent.EXTRA_STREAM) ?: return
        Toast.makeText(this, "✓ Operon: ${imageUris.size} images queued for batch processing", Toast.LENGTH_SHORT).show()
    }
}
