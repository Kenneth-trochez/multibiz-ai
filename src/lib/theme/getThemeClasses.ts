export function getThemeClasses(theme: string) {
  switch (theme) {
    case "dark":
      return {
        pageBg:
          "min-h-screen bg-[radial-gradient(circle_at_top_right,rgba(255,115,0,0.12),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.05),transparent_25%),#181818] text-white",
        sidebarBg: "bg-[#121212]/95 border-[#2d2d2d] backdrop-blur-xl",
        sidebarCard: "bg-white/5 border border-white/10 backdrop-blur-xl",
        card: "bg-white/5 border border-white/10 backdrop-blur-xl",
        cardSoft: "bg-white/8 border border-white/10 backdrop-blur-xl",
        subtle: "bg-white/5 border border-white/10",
        input:
          "bg-white/10 border-white/15 text-white placeholder:text-white/45 backdrop-blur-md",
        select: "bg-[#232323] border-[#3b3b3b] text-white",
        option: "bg-[#232323] text-white",
        textMuted: "text-[#bdbdbd]",
        label: "text-[#f3f3f3]",
        hover: "hover:bg-white/10",
        active: "bg-white text-black",
        accent: "bg-white text-black",
        softAccent: "bg-white/10 text-white border border-white/10",
        buttonPrimary: "bg-white text-black hover:bg-[#e8e8e8]",
        buttonSecondary:
          "bg-white/10 border border-white/15 text-white hover:bg-white/15",
        logoutButton:
          "bg-[#3a2020] border border-[#5a2d2d] text-white hover:bg-[#4a2525]",
        danger: "bg-red-600 text-white hover:bg-red-700",
        glassCard:
          "bg-white/10 border border-white/15 text-white shadow-2xl backdrop-blur-xl",
        headerBg: "bg-[#181818]/80 border-[#2f2f2f] backdrop-blur-xl",
      };

    case "elegant":
      return {
        pageBg: "min-h-screen bg-[#f4efe8] text-[#2b211b]",
        sidebarBg: "bg-[#fffaf5]/95 border-[#e6d8c8] backdrop-blur-xl",
        sidebarCard: "bg-white/70 border border-white/50 backdrop-blur-xl",
        card: "bg-white/65 border border-white/50 backdrop-blur-xl",
        cardSoft: "bg-white/78 border border-white/55 backdrop-blur-xl",
        subtle: "bg-[#f9f2e8] border border-[#eadfce]",
        input:
          "bg-white/75 border-white/50 text-[#2b211b] placeholder:text-[#7a6858] backdrop-blur-md",
        select: "bg-white/85 border-[#d8c7b7] text-[#2b211b]",
        option: "bg-white text-[#2b211b]",
        textMuted: "text-[#7a6858]",
        label: "text-[#3e3027]",
        hover: "hover:bg-[#f3e8dc]",
        active: "bg-[#6b4f3a] text-white",
        accent: "bg-[#6b4f3a] text-white",
        softAccent: "bg-[#efe4d7] text-[#5e4635] border border-[#dec9b3]",
        buttonPrimary: "bg-[#6b4f3a] text-white hover:bg-[#5a4331]",
        buttonSecondary:
          "bg-white/80 border border-[#d8c7b7] text-[#2b211b] hover:bg-[#f3e8dc]",
        logoutButton:
          "bg-[#7c3f3f] border border-[#7c3f3f] text-white hover:bg-[#693434]",
        danger: "bg-red-600 text-white hover:bg-red-700",
        glassCard:
          "bg-white/60 border border-white/50 text-[#2b211b] shadow-2xl backdrop-blur-xl",
        headerBg: "bg-[#f4efe8]/80 border-[#e6d8c8] backdrop-blur-xl",
      };

    case "minimal":
      return {
        pageBg: "min-h-screen bg-[#f8f8f8] text-[#1f1f1f]",
        sidebarBg: "bg-white/95 border-[#e5e5e5] backdrop-blur-xl",
        sidebarCard: "bg-white/75 border border-white/60 backdrop-blur-xl",
        card: "bg-white/75 border border-white/60 backdrop-blur-xl",
        cardSoft: "bg-white/88 border border-white/65 backdrop-blur-xl",
        subtle: "bg-[#f3f3f3] border border-[#e1e1e1]",
        input:
          "bg-white/85 border-white/65 text-[#1f1f1f] placeholder:text-[#6f6f6f] backdrop-blur-md",
        select: "bg-white border-[#d6d6d6] text-[#1f1f1f]",
        option: "bg-white text-[#1f1f1f]",
        textMuted: "text-[#6f6f6f]",
        label: "text-[#222222]",
        hover: "hover:bg-[#f1f1f1]",
        active: "bg-[#111111] text-white",
        accent: "bg-[#111111] text-white",
        softAccent: "bg-[#f1f1f1] text-[#444444] border border-[#dfdfdf]",
        buttonPrimary: "bg-[#111111] text-white hover:bg-[#222222]",
        buttonSecondary:
          "bg-white border border-[#d6d6d6] text-[#1f1f1f] hover:bg-[#f1f1f1]",
        logoutButton:
          "bg-[#111111] border border-[#111111] text-white hover:bg-[#222222]",
        danger: "bg-red-600 text-white hover:bg-red-700",
        glassCard:
          "bg-white/70 border border-white/60 text-[#1f1f1f] shadow-2xl backdrop-blur-xl",
        headerBg: "bg-[#f8f8f8]/80 border-[#e5e5e5] backdrop-blur-xl",
      };

    case "rose_glam":
      return {
        pageBg:
          "min-h-screen bg-[radial-gradient(circle_at_top_right,rgba(255,82,168,0.22),transparent_24%),radial-gradient(circle_at_bottom_left,rgba(168,85,247,0.18),transparent_26%),#140d14] text-white",
        sidebarBg: "bg-[#140f17]/95 border-[#352339] backdrop-blur-xl",
        sidebarCard: "bg-white/8 border border-white/12 backdrop-blur-xl",
        card: "bg-white/8 border border-white/12 backdrop-blur-xl",
        cardSoft: "bg-white/10 border border-white/14 backdrop-blur-xl",
        subtle: "bg-white/6 border border-white/10",
        input:
          "bg-white/10 border-white/15 text-white placeholder:text-white/45 backdrop-blur-md",
        select: "bg-[#2a1d2e] border-[#503257] text-white",
        option: "bg-[#2a1d2e] text-white",
        textMuted: "text-[#f0c9df]",
        label: "text-[#fff1f7]",
        hover: "hover:bg-white/12",
        active: "bg-[#ff4fa3] text-white",
        accent: "bg-[#ff4fa3] text-white",
        softAccent: "bg-[#ff4fa3]/15 text-[#ffc0de] border border-[#ff4fa3]/30",
        buttonPrimary: "bg-[#ff4fa3] text-white hover:bg-[#f03f95]",
        buttonSecondary:
          "bg-white/10 border border-white/15 text-white hover:bg-white/15",
        logoutButton:
          "bg-[#6d2245] border border-[#84305a] text-white hover:bg-[#7c2950]",
        danger: "bg-red-600 text-white hover:bg-red-700",
        glassCard:
          "bg-white/10 border border-white/15 text-white shadow-2xl backdrop-blur-xl",
        headerBg: "bg-[#140d14]/80 border-[#3a2440] backdrop-blur-xl",
      };

    case "sunset_pop":
      return {
        pageBg:
          "min-h-screen bg-[radial-gradient(circle_at_top_right,rgba(255,128,0,0.22),transparent_24%),radial-gradient(circle_at_bottom_left,rgba(255,84,0,0.16),transparent_26%),#0f0f12] text-white",
        sidebarBg: "bg-[#111216]/95 border-[#2d2b2a] backdrop-blur-xl",
        sidebarCard: "bg-white/7 border border-white/10 backdrop-blur-xl",
        card: "bg-white/7 border border-white/10 backdrop-blur-xl",
        cardSoft: "bg-white/10 border border-white/12 backdrop-blur-xl",
        subtle: "bg-white/5 border border-white/10",
        input:
          "bg-white/10 border-white/15 text-white placeholder:text-white/45 backdrop-blur-md",
        select: "bg-[#26221f] border-[#4d3b2c] text-white",
        option: "bg-[#26221f] text-white",
        textMuted: "text-[#d6c1b2]",
        label: "text-[#fff4ed]",
        hover: "hover:bg-white/12",
        active: "bg-[#ff7a00] text-white",
        accent: "bg-[#ff7a00] text-white",
        softAccent: "bg-[#ff7a00]/15 text-[#ffcfaa] border border-[#ff7a00]/30",
        buttonPrimary: "bg-[#ff7a00] text-white hover:bg-[#ec6f00]",
        buttonSecondary:
          "bg-white/10 border border-white/15 text-white hover:bg-white/15",
        logoutButton:
          "bg-[#693721] border border-[#874a2a] text-white hover:bg-[#7a4024]",
        danger: "bg-red-600 text-white hover:bg-red-700",
        glassCard:
          "bg-white/10 border border-white/15 text-white shadow-2xl backdrop-blur-xl",
        headerBg: "bg-[#0f0f12]/80 border-[#2f2a25] backdrop-blur-xl",
      };

    case "violet_neon":
      return {
        pageBg:
          "min-h-screen bg-[radial-gradient(circle_at_top_right,rgba(139,92,246,0.24),transparent_24%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.18),transparent_28%),#0d1020] text-white",
        sidebarBg: "bg-[#11142a]/95 border-[#292e54] backdrop-blur-xl",
        sidebarCard: "bg-white/8 border border-white/12 backdrop-blur-xl",
        card: "bg-white/8 border border-white/12 backdrop-blur-xl",
        cardSoft: "bg-white/10 border border-white/14 backdrop-blur-xl",
        subtle: "bg-white/6 border border-white/10",
        input:
          "bg-white/10 border-white/15 text-white placeholder:text-white/45 backdrop-blur-md",
        select: "bg-[#1f2443] border-[#3f4b87] text-white",
        option: "bg-[#1f2443] text-white",
        textMuted: "text-[#c7c9f1]",
        label: "text-[#f3f4ff]",
        hover: "hover:bg-white/12",
        active: "bg-[#8b5cf6] text-white",
        accent: "bg-[#8b5cf6] text-white",
        softAccent: "bg-[#8b5cf6]/15 text-[#d9ccff] border border-[#8b5cf6]/30",
        buttonPrimary: "bg-[#8b5cf6] text-white hover:bg-[#7c4df0]",
        buttonSecondary:
          "bg-white/10 border border-white/15 text-white hover:bg-white/15",
        logoutButton:
          "bg-[#34295f] border border-[#48367d] text-white hover:bg-[#3d3070]",
        danger: "bg-red-600 text-white hover:bg-red-700",
        glassCard:
          "bg-white/10 border border-white/15 text-white shadow-2xl backdrop-blur-xl",
        headerBg: "bg-[#0d1020]/80 border-[#2e3561] backdrop-blur-xl",
      };

    case "aqua_lux":
      return {
        pageBg:
          "min-h-screen bg-[radial-gradient(circle_at_top_right,rgba(0,229,255,0.18),transparent_22%),radial-gradient(circle_at_bottom_left,rgba(45,212,191,0.16),transparent_28%),#09161a] text-white",
        sidebarBg: "bg-[#0d1c20]/95 border-[#23424a] backdrop-blur-xl",
        sidebarCard: "bg-white/8 border border-white/12 backdrop-blur-xl",
        card: "bg-white/8 border border-white/12 backdrop-blur-xl",
        cardSoft: "bg-white/10 border border-white/14 backdrop-blur-xl",
        subtle: "bg-white/6 border border-white/10",
        input:
          "bg-white/10 border-white/15 text-white placeholder:text-white/45 backdrop-blur-md",
        select: "bg-[#143038] border-[#2d6470] text-white",
        option: "bg-[#143038] text-white",
        textMuted: "text-[#bfe9e7]",
        label: "text-[#efffff]",
        hover: "hover:bg-white/12",
        active: "bg-[#00cfd5] text-black",
        accent: "bg-[#00cfd5] text-black",
        softAccent: "bg-[#00cfd5]/15 text-[#bdfcff] border border-[#00cfd5]/30",
        buttonPrimary: "bg-[#00cfd5] text-black hover:bg-[#00bac0]",
        buttonSecondary:
          "bg-white/10 border border-white/15 text-white hover:bg-white/15",
        logoutButton:
          "bg-[#1d5c63] border border-[#27727b] text-white hover:bg-[#236870]",
        danger: "bg-red-600 text-white hover:bg-red-700",
        glassCard:
          "bg-white/10 border border-white/15 text-white shadow-2xl backdrop-blur-xl",
        headerBg: "bg-[#09161a]/80 border-[#27555f] backdrop-blur-xl",
      };

    case "ruby_night":
      return {
        pageBg:
          "min-h-screen bg-[radial-gradient(circle_at_top_right,rgba(225,29,72,0.2),transparent_24%),radial-gradient(circle_at_bottom_left,rgba(190,24,93,0.16),transparent_28%),#140b10] text-white",
        sidebarBg: "bg-[#180e14]/95 border-[#3e2031] backdrop-blur-xl",
        sidebarCard: "bg-white/8 border border-white/12 backdrop-blur-xl",
        card: "bg-white/8 border border-white/12 backdrop-blur-xl",
        cardSoft: "bg-white/10 border border-white/14 backdrop-blur-xl",
        subtle: "bg-white/6 border border-white/10",
        input:
          "bg-white/10 border-white/15 text-white placeholder:text-white/45 backdrop-blur-md",
        select: "bg-[#2b1620] border-[#5a2b43] text-white",
        option: "bg-[#2b1620] text-white",
        textMuted: "text-[#efc6d2]",
        label: "text-[#fff1f5]",
        hover: "hover:bg-white/12",
        active: "bg-[#e11d48] text-white",
        accent: "bg-[#e11d48] text-white",
        softAccent: "bg-[#e11d48]/15 text-[#ffc3d0] border border-[#e11d48]/30",
        buttonPrimary: "bg-[#e11d48] text-white hover:bg-[#cf1a43]",
        buttonSecondary:
          "bg-white/10 border border-white/15 text-white hover:bg-white/15",
        logoutButton:
          "bg-[#612039] border border-[#7a2848] text-white hover:bg-[#6d2440]",
        danger: "bg-red-600 text-white hover:bg-red-700",
        glassCard:
          "bg-white/10 border border-white/15 text-white shadow-2xl backdrop-blur-xl",
        headerBg: "bg-[#140b10]/80 border-[#4a2235] backdrop-blur-xl",
      };

          case "blush_pop":
      return {
        pageBg: "min-h-screen bg-[#fff1f6] text-[#4a2333]",
        sidebarBg: "bg-[#fff8fb]/95 border-[#f3cddd] backdrop-blur-xl",
        sidebarCard: "bg-white/75 border border-white/60 backdrop-blur-xl",
        card: "bg-white/70 border border-white/60 backdrop-blur-xl",
        cardSoft: "bg-white/82 border border-white/65 backdrop-blur-xl",
        subtle: "bg-[#ffe4ee] border border-[#f3cad8]",
        input:
          "bg-white/85 border-white/65 text-[#4a2333] placeholder:text-[#9a6b7f] backdrop-blur-md",
        select: "bg-white border-[#efbfd0] text-[#4a2333]",
        option: "bg-white text-[#4a2333]",
        textMuted: "text-[#9a6b7f]",
        label: "text-[#5b2e40]",
        hover: "hover:bg-[#ffe0eb]",
        active: "bg-[#ec5f95] text-white",
        accent: "bg-[#ec5f95] text-white",
        softAccent: "bg-[#fbd4e3] text-[#9e3c63] border border-[#f2b7cc]",
        buttonPrimary: "bg-[#ec5f95] text-white hover:bg-[#dd4f86]",
        buttonSecondary:
          "bg-white/85 border border-[#efbfd0] text-[#4a2333] hover:bg-[#ffe7f0]",
        logoutButton:
          "bg-[#b55476] border border-[#b55476] text-white hover:bg-[#a34869]",
        danger: "bg-red-600 text-white hover:bg-red-700",
        glassCard:
          "bg-white/65 border border-white/55 text-[#4a2333] shadow-2xl backdrop-blur-xl",
        headerBg: "bg-[#fff1f6]/80 border-[#f3cad8] backdrop-blur-xl",
      };

    case "cotton_candy":
      return {
        pageBg: "min-h-screen bg-[#fdf4ff] text-[#44275a]",
        sidebarBg: "bg-[#fff9ff]/95 border-[#ebd3f7] backdrop-blur-xl",
        sidebarCard: "bg-white/75 border border-white/60 backdrop-blur-xl",
        card: "bg-white/70 border border-white/60 backdrop-blur-xl",
        cardSoft: "bg-white/82 border border-white/65 backdrop-blur-xl",
        subtle: "bg-[#f8eaff] border border-[#e8d3f3]",
        input:
          "bg-white/85 border-white/65 text-[#44275a] placeholder:text-[#8f72a2] backdrop-blur-md",
        select: "bg-white border-[#dec1ec] text-[#44275a]",
        option: "bg-white text-[#44275a]",
        textMuted: "text-[#8f72a2]",
        label: "text-[#55346d]",
        hover: "hover:bg-[#f6e7ff]",
        active: "bg-[#d66bff] text-white",
        accent: "bg-[#d66bff] text-white",
        softAccent: "bg-[#f1d8ff] text-[#8b3eb1] border border-[#e4b8fb]",
        buttonPrimary: "bg-[#d66bff] text-white hover:bg-[#c85af5]",
        buttonSecondary:
          "bg-white/85 border border-[#dec1ec] text-[#44275a] hover:bg-[#f6eaff]",
        logoutButton:
          "bg-[#9c5cbc] border border-[#9c5cbc] text-white hover:bg-[#8d4fb0]",
        danger: "bg-red-600 text-white hover:bg-red-700",
        glassCard:
          "bg-white/65 border border-white/55 text-[#44275a] shadow-2xl backdrop-blur-xl",
        headerBg: "bg-[#fdf4ff]/80 border-[#e8d3f3] backdrop-blur-xl",
      };

    case "pearl_rose":
      return {
        pageBg: "min-h-screen bg-[#fff7f8] text-[#3f2a2f]",
        sidebarBg: "bg-[#fffdfd]/95 border-[#ecd8dc] backdrop-blur-xl",
        sidebarCard: "bg-white/80 border border-white/65 backdrop-blur-xl",
        card: "bg-white/75 border border-white/60 backdrop-blur-xl",
        cardSoft: "bg-white/88 border border-white/70 backdrop-blur-xl",
        subtle: "bg-[#fdf0f2] border border-[#ead6da]",
        input:
          "bg-white/88 border-white/65 text-[#3f2a2f] placeholder:text-[#8a6a72] backdrop-blur-md",
        select: "bg-white border-[#dfc1c8] text-[#3f2a2f]",
        option: "bg-white text-[#3f2a2f]",
        textMuted: "text-[#8a6a72]",
        label: "text-[#51383f]",
        hover: "hover:bg-[#fcecef]",
        active: "bg-[#cc7f95] text-white",
        accent: "bg-[#cc7f95] text-white",
        softAccent: "bg-[#f5dde4] text-[#8e5364] border border-[#e7bec9]",
        buttonPrimary: "bg-[#cc7f95] text-white hover:bg-[#be7187]",
        buttonSecondary:
          "bg-white/85 border border-[#dfc1c8] text-[#3f2a2f] hover:bg-[#fcecef]",
        logoutButton:
          "bg-[#9b5a69] border border-[#9b5a69] text-white hover:bg-[#8c4f5d]",
        danger: "bg-red-600 text-white hover:bg-red-700",
        glassCard:
          "bg-white/70 border border-white/60 text-[#3f2a2f] shadow-2xl backdrop-blur-xl",
        headerBg: "bg-[#fff7f8]/80 border-[#ead6da] backdrop-blur-xl",
      };

    case "mint_day":
      return {
        pageBg: "min-h-screen bg-[#eefcf7] text-[#1f3d35]",
        sidebarBg: "bg-[#f8fffc]/95 border-[#cfeadf] backdrop-blur-xl",
        sidebarCard: "bg-white/78 border border-white/62 backdrop-blur-xl",
        card: "bg-white/72 border border-white/60 backdrop-blur-xl",
        cardSoft: "bg-white/84 border border-white/65 backdrop-blur-xl",
        subtle: "bg-[#ddf7ee] border border-[#c7e9db]",
        input:
          "bg-white/85 border-white/65 text-[#1f3d35] placeholder:text-[#62867a] backdrop-blur-md",
        select: "bg-white border-[#b8dfcf] text-[#1f3d35]",
        option: "bg-white text-[#1f3d35]",
        textMuted: "text-[#62867a]",
        label: "text-[#295044]",
        hover: "hover:bg-[#e2f8f0]",
        active: "bg-[#28c493] text-white",
        accent: "bg-[#28c493] text-white",
        softAccent: "bg-[#cff4e6] text-[#1f7f62] border border-[#afe5d2]",
        buttonPrimary: "bg-[#28c493] text-white hover:bg-[#22b286]",
        buttonSecondary:
          "bg-white/85 border border-[#b8dfcf] text-[#1f3d35] hover:bg-[#e9faf4]",
        logoutButton:
          "bg-[#3e8b73] border border-[#3e8b73] text-white hover:bg-[#367a65]",
        danger: "bg-red-600 text-white hover:bg-red-700",
        glassCard:
          "bg-white/68 border border-white/58 text-[#1f3d35] shadow-2xl backdrop-blur-xl",
        headerBg: "bg-[#eefcf7]/80 border-[#c7e9db] backdrop-blur-xl",
      };

    case "sky_breeze":
      return {
        pageBg: "min-h-screen bg-[#f1f8ff] text-[#20364f]",
        sidebarBg: "bg-[#f9fcff]/95 border-[#cfe1f4] backdrop-blur-xl",
        sidebarCard: "bg-white/78 border border-white/62 backdrop-blur-xl",
        card: "bg-white/72 border border-white/60 backdrop-blur-xl",
        cardSoft: "bg-white/84 border border-white/65 backdrop-blur-xl",
        subtle: "bg-[#e3f0fc] border border-[#cddff0]",
        input:
          "bg-white/85 border-white/65 text-[#20364f] placeholder:text-[#69829e] backdrop-blur-md",
        select: "bg-white border-[#bdd4eb] text-[#20364f]",
        option: "bg-white text-[#20364f]",
        textMuted: "text-[#69829e]",
        label: "text-[#2a4664]",
        hover: "hover:bg-[#e9f4ff]",
        active: "bg-[#4f9cff] text-white",
        accent: "bg-[#4f9cff] text-white",
        softAccent: "bg-[#d8eaff] text-[#3069b8] border border-[#bdd8ff]",
        buttonPrimary: "bg-[#4f9cff] text-white hover:bg-[#418ff5]",
        buttonSecondary:
          "bg-white/85 border border-[#bdd4eb] text-[#20364f] hover:bg-[#edf6ff]",
        logoutButton:
          "bg-[#4c78a8] border border-[#4c78a8] text-white hover:bg-[#426b96]",
        danger: "bg-red-600 text-white hover:bg-red-700",
        glassCard:
          "bg-white/68 border border-white/58 text-[#20364f] shadow-2xl backdrop-blur-xl",
        headerBg: "bg-[#f1f8ff]/80 border-[#cddff0] backdrop-blur-xl",
      };

    case "warm":
    default:
      return {
        pageBg: "min-h-screen bg-[#f6f1e8] text-[#2f241d]",
        sidebarBg: "bg-[#fffaf3]/95 border-[#e7d8c7] backdrop-blur-xl",
        sidebarCard: "bg-white/70 border border-white/55 backdrop-blur-xl",
        card: "bg-white/65 border border-white/50 backdrop-blur-xl",
        cardSoft: "bg-white/78 border border-white/55 backdrop-blur-xl",
        subtle: "bg-[#f9f2e8] border border-[#eadfce]",
        input:
          "bg-white/75 border-white/50 text-[#2f241d] placeholder:text-[#6b5b4d] backdrop-blur-md",
        select: "bg-white border-[#d9c6b2] text-[#2f241d]",
        option: "bg-white text-[#2f241d]",
        textMuted: "text-[#6b5b4d]",
        label: "text-[#3f3128]",
        hover: "hover:bg-[#f3e8dc]",
        active: "bg-[#a56a3a] text-white",
        accent: "bg-[#a56a3a] text-white",
        softAccent: "bg-[#f1e5d7] text-[#6b4f3a] border border-[#e0c8b0]",
        buttonPrimary: "bg-[#a56a3a] text-white hover:bg-[#8d582e]",
        buttonSecondary:
          "bg-white/80 border border-[#d9c6b2] text-[#2f241d] hover:bg-[#f3e8dc]",
        logoutButton:
          "bg-[#8e4a3a] border border-[#8e4a3a] text-white hover:bg-[#7b3f31]",
        danger: "bg-red-600 text-white hover:bg-red-700",
        glassCard:
          "bg-white/55 border border-white/50 text-[#2f241d] shadow-2xl backdrop-blur-xl",
        headerBg: "bg-[#f6f1e8]/80 border-[#eadfce] backdrop-blur-xl",
      };
  }
}