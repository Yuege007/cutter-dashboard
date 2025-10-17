/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // 启用基于 CSS 类的深色模式
  theme: {
    extend: {
      fontFamily: {
        sans: ['PingFang SC', 'Microsoft YaHei', 'sans-serif']
      },
      colors: {
        // 浅色主题颜色
        primary: '#0066CC',
        success: '#3E8635',
        warning: '#F0AB00',
        danger: '#C9190B',

        // 深色模式专用颜色
        dark: {
          primary: '#3b82f6',
          success: '#10b981',
          warning: '#f59e0b',
          danger: '#ef4444',
          background: '#0f172a',
          surface: '#1e293b',
          text: '#f1f5f9',
          'text-secondary': '#94a3b8'
        },

        // 科技蓝主题颜色
        tech: {
          primary: '#00d4ff',
          success: '#00ff88',
          warning: '#ffaa00',
          danger: '#ff4757',
          background: '#0a0e1a',
          surface: '#1a1f2e',
          text: '#ffffff',
          'text-secondary': '#8892b0'
        }
      },
      borderRadius: {
        'card': '12px'
      },
      backdropBlur: {
        'card': '12px'
      }
    },
  },
  plugins: [],
}
