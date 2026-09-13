/**
 * OPERON Design Tokens
 */
export const tokens = {
  colors: {
    themes: {
      graphite: {
        id: 'graphite',
        name: 'Graphite Dark',
        surface0: '#0a0c0e',
        surface1: '#121518',
        surface2: '#1a1e22',
        surface3: '#23282e',
        borderFaint: 'rgba(255, 255, 255, 0.05)',
        borderSubtle: 'rgba(255, 255, 255, 0.10)',
        borderStrong: 'rgba(255, 255, 255, 0.18)',
        textPrimary: '#f1f5f9',
        textSecondary: '#94a3b8',
        textTertiary: '#64748b'
      },
      midnight: {
        id: 'midnight',
        name: 'Midnight Slate',
        surface0: '#080c14',
        surface1: '#0e1522',
        surface2: '#162032',
        surface3: '#1f2b42',
        borderFaint: 'rgba(148, 163, 184, 0.08)',
        borderSubtle: 'rgba(148, 163, 184, 0.15)',
        borderStrong: 'rgba(148, 163, 184, 0.25)',
        textPrimary: '#f8fafc',
        textSecondary: '#94a3b8',
        textTertiary: '#64748b'
      },
      oled: {
        id: 'oled',
        name: 'OLED Black',
        surface0: '#000000',
        surface1: '#0a0a0a',
        surface2: '#141414',
        surface3: '#1e1e1e',
        borderFaint: 'rgba(255, 255, 255, 0.08)',
        borderSubtle: 'rgba(255, 255, 255, 0.16)',
        borderStrong: 'rgba(255, 255, 255, 0.32)',
        textPrimary: '#ffffff',
        textSecondary: '#a3a3a3',
        textTertiary: '#737373'
      },
      lunar: {
        id: 'lunar',
        name: 'Lunar Light',
        surface0: '#f8fafc',
        surface1: '#ffffff',
        surface2: '#f1f5f9',
        surface3: '#e2e8f0',
        borderFaint: 'rgba(0, 0, 0, 0.06)',
        borderSubtle: 'rgba(0, 0, 0, 0.12)',
        borderStrong: 'rgba(0, 0, 0, 0.22)',
        textPrimary: '#0f172a',
        textSecondary: '#475569',
        textTertiary: '#94a3b8'
      }
    },
    accent: {
      primary: '#38bdf8',
      hover: '#0ea5e9',
      glow: 'rgba(56, 189, 248, 0.16)',
      success: '#34d399',
      warning: '#fbbf24',
      danger: '#f87171'
    }
  },
  typography: {
    fontSans: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI Variable Text", Roboto, sans-serif',
    fontMono: '"JetBrains Mono", "Cascadia Code", "SF Mono", Menlo, Consolas, monospace',
    sizes: {
      xs: '11px',
      sm: '12px',
      base: '13px',
      md: '15px',
      lg: '18px',
      xl: '22px',
      display: '28px'
    }
  },
  animation: {
    fast: '100ms cubic-bezier(0.16, 1, 0.3, 1)',
    med: '180ms cubic-bezier(0.16, 1, 0.3, 1)',
    overlay: '220ms cubic-bezier(0.16, 1, 0.3, 1)'
  }
};
