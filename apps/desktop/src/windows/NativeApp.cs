using System;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Net;
using System.Runtime.InteropServices;
using System.Threading;
using System.Windows.Forms;

namespace Operon.Windows
{
    public class OperonHost : Form
    {
        [DllImport("user32.dll")]
        private static extern bool RegisterHotKey(IntPtr hWnd, int id, int fsModifiers, int vk);

        [DllImport("user32.dll")]
        private static extern bool UnregisterHotKey(IntPtr hWnd, int id);

        [DllImport("user32.dll")]
        private static extern bool SetForegroundWindow(IntPtr hWnd);

        private const int HOTKEY_ID = 9000;
        private const int MOD_ALT = 0x0001;
        private const int VK_SPACE = 0x20;
        private const int WM_HOTKEY = 0x0312;

        private NotifyIcon trayIcon;
        private ContextMenuStrip trayMenu;
        private Process nodeProcess;
        private int serverPort = 49215;
        private string appRoot;
        private Process appWindowProcess;

        [STAThread]
        public static void Main(string[] args)
        {
            bool isFirstInstance;
            using (Mutex mutex = new Mutex(true, "Global\\Operon_Desktop_App_Mutex", out isFirstInstance))
            {
                if (!isFirstInstance)
                {
                    MessageBox.Show("OPERON is already running in your system tray.\nPress Alt+Space to open the HUD.",
                        "OPERON Active", MessageBoxButtons.OK, MessageBoxIcon.Information);
                    return;
                }

                Application.EnableVisualStyles();
                Application.SetCompatibleTextRenderingDefault(false);
                Application.Run(new OperonHost());
            }
        }

        public OperonHost()
        {
            this.WindowState = FormWindowState.Minimized;
            this.ShowInTaskbar = false;
            this.FormBorderStyle = FormBorderStyle.None;
            this.Size = new Size(0, 0);

            // Determine application directory
            appRoot = AppDomain.CurrentDomain.BaseDirectory;
            // Handle if located inside apps/desktop/src/windows
            if (!File.Exists(Path.Combine(appRoot, "package.json")))
            {
                string parent3 = Path.GetFullPath(Path.Combine(appRoot, "..", "..", "..", ".."));
                if (File.Exists(Path.Combine(parent3, "package.json")))
                {
                    appRoot = parent3;
                }
            }

            InitializeTray();
            StartBackendEngine();
        }

        protected override void OnLoad(EventArgs e)
        {
            base.OnLoad(e);
            this.Visible = false;

            // Register global Alt+Space hotkey
            bool hotkeyRegistered = RegisterHotKey(this.Handle, HOTKEY_ID, MOD_ALT, VK_SPACE);
            if (!hotkeyRegistered)
            {
                trayIcon.ShowBalloonTip(3000, "OPERON", "Alt+Space is reserved by another app. Click tray icon to open.", ToolTipIcon.Warning);
            }
            else
            {
                trayIcon.ShowBalloonTip(2500, "OPERON Ready", "Autonomous Operating Layer is active. Press Alt+Space.", ToolTipIcon.Info);
            }

            // Automatically open HUD on initial launch
            OpenAppWindow("hud");
        }

        protected override void WndProc(ref Message m)
        {
            if (m.Msg == WM_HOTKEY && m.WParam.ToInt32() == HOTKEY_ID)
            {
                ToggleHUD();
            }
            base.WndProc(ref m);
        }

        private void InitializeTray()
        {
            trayMenu = new ContextMenuStrip();
            
            ToolStripMenuItem titleItem = new ToolStripMenuItem("OPERON (Personal OS)") { Enabled = false };
            titleItem.Font = new Font(titleItem.Font, FontStyle.Bold);
            trayMenu.Items.Add(titleItem);
            trayMenu.Items.Add(new ToolStripSeparator());

            trayMenu.Items.Add("Quick Command HUD (Alt+Space)", null, (s, e) => ToggleHUD());
            trayMenu.Items.Add("Workflow Studio", null, (s, e) => OpenAppWindow("studio"));
            trayMenu.Items.Add("Curated Recipe Library", null, (s, e) => OpenAppWindow("library"));
            trayMenu.Items.Add("Settings & Licensing", null, (s, e) => OpenAppWindow("settings"));
            trayMenu.Items.Add(new ToolStripSeparator());

            trayMenu.Items.Add("1-Click Clean Clipboard Link", null, (s, e) => ExecuteClipboardClean());
            trayMenu.Items.Add(new ToolStripSeparator());

            trayMenu.Items.Add("Exit OPERON", null, (s, e) => CleanExit());

            // Create programmatically crisp glyph icon
            Bitmap bmp = new Bitmap(32, 32);
            using (Graphics g = Graphics.FromImage(bmp))
            {
                g.SmoothingMode = System.Drawing.Drawing2D.SmoothingMode.AntiAlias;
                g.Clear(Color.Transparent);
                using (Brush brush = new SolidBrush(Color.FromArgb(20, 20, 24)))
                {
                    g.FillEllipse(brush, 1, 1, 30, 30);
                }
                using (Pen pen = new Pen(Color.FromArgb(160, 160, 255), 2.5f))
                {
                    g.DrawEllipse(pen, 6, 6, 20, 20);
                    g.DrawLine(pen, 16, 6, 16, 26);
                }
            }
            Icon icon = Icon.FromHandle(bmp.GetHicon());

            trayIcon = new NotifyIcon
            {
                Text = "OPERON - The Autonomous Operating Layer",
                Icon = icon,
                ContextMenuStrip = trayMenu,
                Visible = true
            };

            trayIcon.DoubleClick += (s, e) => ToggleHUD();
        }

        private void StartBackendEngine()
        {
            try
            {
                // Find node executable: local bundled or system path
                string nodeExe = Path.Combine(appRoot, "bin", "node.exe");
                if (!File.Exists(nodeExe))
                {
                    nodeExe = "node.exe";
                }

                string mainScript = Path.Combine(appRoot, "apps", "desktop", "src", "main.js");
                if (!File.Exists(mainScript))
                {
                    mainScript = Path.Combine(appRoot, "src", "main.js");
                }

                ProcessStartInfo psi = new ProcessStartInfo
                {
                    FileName = nodeExe,
                    Arguments = "\"" + mainScript + "\"",
                    WorkingDirectory = appRoot,
                    CreateNoWindow = true,
                    UseShellExecute = false,
                    RedirectStandardOutput = false,
                    RedirectStandardError = false
                };
                psi.EnvironmentVariables["PORT"] = serverPort.ToString();

                nodeProcess = Process.Start(psi);
                Thread.Sleep(800); // Allow server initialization
            }
            catch (Exception ex)
            {
                MessageBox.Show("Failed to launch OPERON background engine: " + ex.Message, "OPERON Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        private void ToggleHUD()
        {
            OpenAppWindow("hud");
        }

        private void OpenAppWindow(string mode)
        {
            string targetUrl = string.Format("http://127.0.0.1:{0}/?mode={1}", serverPort, mode);

            try
            {
                // Check if existing window process is still alive
                if (appWindowProcess != null && !appWindowProcess.HasExited)
                {
                    IntPtr hwnd = appWindowProcess.MainWindowHandle;
                    if (hwnd != IntPtr.Zero)
                    {
                        SetForegroundWindow(hwnd);
                        return;
                    }
                }

                // Locate Edge for standalone app mode
                string edgePath = @"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe";
                if (!File.Exists(edgePath))
                {
                    edgePath = @"C:\Program Files\Microsoft\Edge\Application\msedge.exe";
                }

                if (File.Exists(edgePath))
                {
                    ProcessStartInfo psi = new ProcessStartInfo
                    {
                        FileName = edgePath,
                        Arguments = string.Format("--app=\"{0}\" --window-size=940,700 --app-id=\"OperonApp\"", targetUrl),
                        UseShellExecute = false
                    };
                    appWindowProcess = Process.Start(psi);
                }
                else
                {
                    // Fallback to default browser
                    Process.Start(new ProcessStartInfo(targetUrl) { UseShellExecute = true });
                }
            }
            catch (Exception ex)
            {
                trayIcon.ShowBalloonTip(2000, "OPERON UI", "Error opening UI: " + ex.Message, ToolTipIcon.Error);
            }
        }

        private void ExecuteClipboardClean()
        {
            try
            {
                string raw = Clipboard.GetText();
                if (string.IsNullOrEmpty(raw) || !raw.Contains("http"))
                {
                    trayIcon.ShowBalloonTip(1500, "OPERON", "Clipboard does not contain a valid URL.", ToolTipIcon.Info);
                    return;
                }

                // Clean tracking queries via local HTTP execute endpoint
                string postData = "{\"workflowId\":\"recipe_clean_url\",\"input\":{\"url\":\"" + raw.Replace("\"", "\\\"") + "\"}}";
                using (WebClient client = new WebClient())
                {
                    client.Headers[HttpRequestHeader.ContentType] = "application/json";
                    string endpoint = string.Format("http://127.0.0.1:{0}/api/execute", serverPort);
                    string resp = client.UploadString(endpoint, "POST", postData);
                    
                    if (resp.Contains("\"cleanedUrl\""))
                    {
                        // Parse cleaned URL
                        int idx = resp.IndexOf("\"cleanedUrl\":");
                        if (idx != -1)
                        {
                            int start = resp.IndexOf("\"", idx + 13) + 1;
                            int end = resp.IndexOf("\"", start);
                            string clean = resp.Substring(start, end - start).Replace("\\/", "/");
                            Clipboard.SetText(clean);
                            trayIcon.ShowBalloonTip(2000, "Cleaned URL Ready", clean, ToolTipIcon.Info);
                            return;
                        }
                    }
                }
                trayIcon.ShowBalloonTip(1500, "OPERON", "Clipboard URL cleaned successfully.", ToolTipIcon.Info);
            }
            catch (Exception ex)
            {
                trayIcon.ShowBalloonTip(2000, "Clean Failed", ex.Message, ToolTipIcon.Warning);
            }
        }

        private void CleanExit()
        {
            UnregisterHotKey(this.Handle, HOTKEY_ID);
            if (trayIcon != null)
            {
                trayIcon.Visible = false;
                trayIcon.Dispose();
            }

            if (appWindowProcess != null && !appWindowProcess.HasExited)
            {
                try { appWindowProcess.Kill(); } catch { }
            }

            if (nodeProcess != null && !nodeProcess.HasExited)
            {
                try { nodeProcess.Kill(); } catch { }
            }

            Application.Exit();
        }

        protected override void Dispose(bool disposing)
        {
            if (disposing)
            {
                UnregisterHotKey(this.Handle, HOTKEY_ID);
                if (trayIcon != null) trayIcon.Dispose();
                if (trayMenu != null) trayMenu.Dispose();
            }
            base.Dispose(disposing);
        }
    }
}
