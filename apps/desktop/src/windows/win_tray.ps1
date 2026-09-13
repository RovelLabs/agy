param (
    [int]$Port = 49210
)

# Suppress console window and load Windows Forms
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

$hudUrl = "http://localhost:$Port"

# Initialize Tray NotifyIcon
$notifyIcon = New-Object System.Windows.Forms.NotifyIcon
$notifyIcon.Text = "OPERON — Autonomous Operating Layer"
$notifyIcon.Icon = [System.Drawing.SystemIcons]::Application
$notifyIcon.Visible = $true

# Context Menu
$contextMenu = New-Object System.Windows.Forms.ContextMenuStrip

# Item: Open Quick HUD
$itemHud = New-Object System.Windows.Forms.ToolStripMenuItem
$itemHud.Text = "⚡ Open Quick HUD (Alt+Space)"
$itemHud.Font = New-Object System.Drawing.Font($itemHud.Font, [System.Drawing.FontStyle]::Bold)
$itemHud.add_Click({
    Start-Process $hudUrl
})
[void]$contextMenu.Items.Add($itemHud)

# Item: Open Workflow Studio
$itemStudio = New-Object System.Windows.Forms.ToolStripMenuItem
$itemStudio.Text = "🛠️ Open Workflow Studio"
$itemStudio.add_Click({
    Start-Process "$hudUrl"
})
[void]$contextMenu.Items.Add($itemStudio)

# Item: Recipe Library
$itemLib = New-Object System.Windows.Forms.ToolStripMenuItem
$itemLib.Text = "📚 Recipe Library (30 Recipes)"
$itemLib.add_Click({
    Start-Process "$hudUrl"
})
[void]$contextMenu.Items.Add($itemLib)

# Separator
[void]$contextMenu.Items.Add((New-Object System.Windows.Forms.ToolStripSeparator))

# Item: Settings & License
$itemSettings = New-Object System.Windows.Forms.ToolStripMenuItem
$itemSettings.Text = "⚙️ Settings & License"
$itemSettings.add_Click({
    Start-Process "$hudUrl"
})
[void]$contextMenu.Items.Add($itemSettings)

# Item: Clean Tracking URL (Instant Recipe Action)
$itemCleanUrl = New-Object System.Windows.Forms.ToolStripMenuItem
$itemCleanUrl.Text = "🧹 Strip Tracking from Clipboard Now"
$itemCleanUrl.add_Click({
    try {
        $clip = [System.Windows.Forms.Clipboard]::GetText()
        if ($clip) {
            # Strip UTM query params
            $cleaned = [System.Text.RegularExpressions.Regex]::Replace($clip, '(?<=[?&])(utm_[^&=]+|fbclid|gclid|igshid)=[^&#]*(&|$)', '')
            $cleaned = $cleaned.TrimEnd('?', '&')
            [System.Windows.Forms.Clipboard]::SetText($cleaned)
            $notifyIcon.ShowBalloonTip(2000, "OPERON", "Cleaned URL copied to clipboard.", [System.Windows.Forms.ToolTipIcon]::Info)
        }
    } catch {
        # Clipboard error fallback
    }
})
[void]$contextMenu.Items.Add($itemCleanUrl)

# Separator
[void]$contextMenu.Items.Add((New-Object System.Windows.Forms.ToolStripSeparator))

# Item: Exit
$itemExit = New-Object System.Windows.Forms.ToolStripMenuItem
$itemExit.Text = "✕ Exit Operon"
$itemExit.add_Click({
    $notifyIcon.Visible = $false
    $notifyIcon.Dispose()
    [System.Windows.Forms.Application]::Exit()
    Stop-Process -Id $PID
})
[void]$contextMenu.Items.Add($itemExit)

# Assign menu and double-click handler
$notifyIcon.ContextMenuStrip = $contextMenu
$notifyIcon.add_DoubleClick({
    Start-Process $hudUrl
})

# Show Initial Notification
$notifyIcon.ShowBalloonTip(3000, "OPERON Active", "Press Alt+Space anytime or click tray icon to summon.", [System.Windows.Forms.ToolTipIcon]::Info)

# Run Message Loop
[System.Windows.Forms.Application]::Run()
