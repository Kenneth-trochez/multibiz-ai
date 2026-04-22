export function getThemeClasses(theme: string) {
    switch (theme) {
        case "dark":
            return {
                pageBg:
                    "min-h-screen bg-[radial-gradient(circle_at_15%_15%,rgba(255,115,0,0.10),transparent_0,transparent_28%),radial-gradient(circle_at_85%_18%,rgba(255,255,255,0.05),transparent_0,transparent_22%),radial-gradient(circle_at_50%_100%,rgba(255,255,255,0.03),transparent_0,transparent_30%),linear-gradient(180deg,#141414_0%,#181818_38%,#121212_100%)] text-white",
                sidebarBg: "bg-[#111111]/88 border-[#2b2b2b] backdrop-blur-2xl supports-[backdrop-filter]:bg-[#111111]/78",
                sidebarCard: "bg-white/[0.06] border border-white/[0.09] shadow-[0_10px_30px_rgba(0,0,0,0.28)] backdrop-blur-xl",
                card: "bg-white/[0.055] border border-white/[0.08] shadow-[0_14px_40px_rgba(0,0,0,0.32)] backdrop-blur-xl",
                cardSoft: "bg-white/[0.075] border border-white/[0.10] shadow-[0_10px_28px_rgba(0,0,0,0.24)] backdrop-blur-xl",
                subtle: "bg-white/[0.045] border border-white/[0.08]",
                input:
                    "bg-white/[0.08] border-white/[0.12] text-white placeholder:text-white/40 backdrop-blur-md focus:border-white/20 focus:bg-white/[0.10]",
                select: "bg-[#202020] border-[#353535] text-white",
                option: "bg-[#202020] text-white",
                textMuted: "text-[#b7b7b7]",
                label: "text-[#f5f5f5]",
                hover: "hover:bg-white/[0.09]",
                active: "bg-white text-black shadow-[0_10px_25px_rgba(255,255,255,0.08)]",
                accent: "bg-white text-black shadow-[0_10px_25px_rgba(255,255,255,0.08)]",
                softAccent: "bg-white/[0.10] text-white border border-white/[0.12]",
                buttonPrimary: "bg-white text-black hover:bg-[#ececec] shadow-[0_12px_28px_rgba(255,255,255,0.08)]",
                buttonSecondary:
                    "bg-white/[0.09] border border-white/[0.12] text-white hover:bg-white/[0.13]",
                logoutButton:
                    "bg-[#3b2323] border border-[#543030] text-white hover:bg-[#472929]",
                danger: "bg-red-600 text-white hover:bg-red-700",
                glassCard:
                    "bg-white/[0.085] border border-white/[0.12] text-white shadow-[0_18px_45px_rgba(0,0,0,0.34)] backdrop-blur-2xl",
                headerBg: "bg-[#141414]/74 border-[#2a2a2a] backdrop-blur-2xl supports-[backdrop-filter]:bg-[#141414]/62",
            };

        case "elegant":
            return {
                pageBg:
                    "min-h-screen bg-[radial-gradient(circle_at_12%_10%,rgba(107,79,58,0.10),transparent_0,transparent_24%),radial-gradient(circle_at_90%_12%,rgba(255,255,255,0.45),transparent_0,transparent_26%),linear-gradient(180deg,#f7f1ea_0%,#f4efe8_42%,#efe7dd_100%)] text-[#2b211b]",
                sidebarBg: "bg-[#fffaf5]/84 border-[#e7d8c8] backdrop-blur-2xl",
                sidebarCard: "bg-white/70 border border-white/60 shadow-[0_12px_30px_rgba(107,79,58,0.08)] backdrop-blur-xl",
                card: "bg-white/66 border border-white/58 shadow-[0_16px_36px_rgba(107,79,58,0.10)] backdrop-blur-xl",
                cardSoft: "bg-white/78 border border-white/65 shadow-[0_12px_26px_rgba(107,79,58,0.07)] backdrop-blur-xl",
                subtle: "bg-[#f8efe4] border border-[#eadfce]",
                input:
                    "bg-white/78 border-white/58 text-[#2b211b] placeholder:text-[#7a6858] backdrop-blur-md focus:border-[#d4c0ad] focus:bg-white/88",
                select: "bg-white/88 border-[#d8c7b7] text-[#2b211b]",
                option: "bg-white text-[#2b211b]",
                textMuted: "text-[#756456]",
                label: "text-[#3e3027]",
                hover: "hover:bg-[#f4e9dd]",
                active: "bg-[#6b4f3a] text-white shadow-[0_12px_28px_rgba(107,79,58,0.18)]",
                accent: "bg-[#6b4f3a] text-white shadow-[0_12px_28px_rgba(107,79,58,0.18)]",
                softAccent: "bg-[#efe4d7] text-[#5e4635] border border-[#dec9b3]",
                buttonPrimary: "bg-[#6b4f3a] text-white hover:bg-[#5f4734] shadow-[0_12px_26px_rgba(107,79,58,0.18)]",
                buttonSecondary:
                    "bg-white/82 border border-[#d8c7b7] text-[#2b211b] hover:bg-[#f3e8dc]",
                logoutButton:
                    "bg-[#7c3f3f] border border-[#7c3f3f] text-white hover:bg-[#693434]",
                danger: "bg-red-600 text-white hover:bg-red-700",
                glassCard:
                    "bg-white/62 border border-white/60 text-[#2b211b] shadow-[0_20px_42px_rgba(107,79,58,0.10)] backdrop-blur-2xl",
                headerBg: "bg-[#f4efe8]/78 border-[#e6d8c8] backdrop-blur-2xl",
            };

        case "minimal":
            return {
                pageBg:
                    "min-h-screen bg-[radial-gradient(circle_at_90%_10%,rgba(0,0,0,0.03),transparent_0,transparent_24%),linear-gradient(180deg,#fafafa_0%,#f7f7f7_45%,#f1f1f1_100%)] text-[#1f1f1f]",
                sidebarBg: "bg-white/86 border-[#e6e6e6] backdrop-blur-2xl",
                sidebarCard: "bg-white/72 border border-white/62 shadow-[0_10px_24px_rgba(0,0,0,0.04)] backdrop-blur-xl",
                card: "bg-white/76 border border-white/62 shadow-[0_14px_30px_rgba(0,0,0,0.05)] backdrop-blur-xl",
                cardSoft: "bg-white/88 border border-white/68 shadow-[0_10px_22px_rgba(0,0,0,0.04)] backdrop-blur-xl",
                subtle: "bg-[#f3f3f3] border border-[#e4e4e4]",
                input:
                    "bg-white/86 border-white/66 text-[#1f1f1f] placeholder:text-[#6f6f6f] backdrop-blur-md focus:border-[#cccccc] focus:bg-white",
                select: "bg-white border-[#d6d6d6] text-[#1f1f1f]",
                option: "bg-white text-[#1f1f1f]",
                textMuted: "text-[#6c6c6c]",
                label: "text-[#222222]",
                hover: "hover:bg-[#f3f3f3]",
                active: "bg-[#111111] text-white shadow-[0_10px_24px_rgba(17,17,17,0.18)]",
                accent: "bg-[#111111] text-white shadow-[0_10px_24px_rgba(17,17,17,0.18)]",
                softAccent: "bg-[#f1f1f1] text-[#444444] border border-[#dfdfdf]",
                buttonPrimary: "bg-[#111111] text-white hover:bg-[#222222] shadow-[0_12px_26px_rgba(17,17,17,0.15)]",
                buttonSecondary:
                    "bg-white border border-[#d6d6d6] text-[#1f1f1f] hover:bg-[#f1f1f1]",
                logoutButton:
                    "bg-[#111111] border border-[#111111] text-white hover:bg-[#222222]",
                danger: "bg-red-600 text-white hover:bg-red-700",
                glassCard:
                    "bg-white/74 border border-white/64 text-[#1f1f1f] shadow-[0_18px_38px_rgba(0,0,0,0.05)] backdrop-blur-2xl",
                headerBg: "bg-[#f8f8f8]/76 border-[#e5e5e5] backdrop-blur-2xl",
            };

        case "rose_glam":
            return {
                pageBg:
                    "min-h-screen bg-[radial-gradient(circle_at_12%_12%,rgba(255,82,168,0.18),transparent_0,transparent_24%),radial-gradient(circle_at_88%_18%,rgba(168,85,247,0.16),transparent_0,transparent_28%),radial-gradient(circle_at_50%_100%,rgba(255,255,255,0.04),transparent_0,transparent_34%),linear-gradient(180deg,#140d14_0%,#171019_44%,#120b13_100%)] text-white",
                sidebarBg: "bg-[#140f17]/86 border-[#352339] backdrop-blur-2xl",
                sidebarCard: "bg-white/[0.075] border border-white/[0.11] shadow-[0_12px_30px_rgba(0,0,0,0.30)] backdrop-blur-xl",
                card: "bg-white/[0.075] border border-white/[0.11] shadow-[0_16px_40px_rgba(0,0,0,0.34)] backdrop-blur-xl",
                cardSoft: "bg-white/[0.095] border border-white/[0.13] shadow-[0_12px_28px_rgba(0,0,0,0.25)] backdrop-blur-xl",
                subtle: "bg-white/[0.055] border border-white/[0.10]",
                input:
                    "bg-white/[0.10] border-white/[0.15] text-white placeholder:text-white/45 backdrop-blur-md focus:border-white/[0.22] focus:bg-white/[0.12]",
                select: "bg-[#2a1d2e] border-[#503257] text-white",
                option: "bg-[#2a1d2e] text-white",
                textMuted: "text-[#efc9dd]",
                label: "text-[#fff3f8]",
                hover: "hover:bg-white/[0.12]",
                active: "bg-[#ff4fa3] text-white shadow-[0_14px_30px_rgba(255,79,163,0.24)]",
                accent: "bg-[#ff4fa3] text-white shadow-[0_14px_30px_rgba(255,79,163,0.24)]",
                softAccent: "bg-[#ff4fa3]/15 text-[#ffc0de] border border-[#ff4fa3]/30",
                buttonPrimary: "bg-[#ff4fa3] text-white hover:bg-[#f03f95] shadow-[0_14px_30px_rgba(255,79,163,0.24)]",
                buttonSecondary:
                    "bg-white/[0.10] border border-white/[0.14] text-white hover:bg-white/[0.15]",
                logoutButton:
                    "bg-[#6d2245] border border-[#84305a] text-white hover:bg-[#7c2950]",
                danger: "bg-red-600 text-white hover:bg-red-700",
                glassCard:
                    "bg-white/[0.10] border border-white/[0.14] text-white shadow-[0_20px_48px_rgba(0,0,0,0.36)] backdrop-blur-2xl",
                headerBg: "bg-[#140d14]/72 border-[#3a2440] backdrop-blur-2xl",
            };

        case "sunset_pop":
            return {
                pageBg:
                    "min-h-screen bg-[radial-gradient(circle_at_15%_15%,rgba(255,128,0,0.18),transparent_0,transparent_24%),radial-gradient(circle_at_86%_18%,rgba(255,84,0,0.14),transparent_0,transparent_28%),radial-gradient(circle_at_50%_100%,rgba(255,255,255,0.03),transparent_0,transparent_30%),linear-gradient(180deg,#101014_0%,#131316_42%,#0c0d10_100%)] text-white",
                sidebarBg: "bg-[#111216]/86 border-[#2d2b2a] backdrop-blur-2xl",
                sidebarCard: "bg-white/[0.065] border border-white/[0.10] shadow-[0_12px_28px_rgba(0,0,0,0.30)] backdrop-blur-xl",
                card: "bg-white/[0.065] border border-white/[0.10] shadow-[0_16px_38px_rgba(0,0,0,0.34)] backdrop-blur-xl",
                cardSoft: "bg-white/[0.09] border border-white/[0.12] shadow-[0_12px_26px_rgba(0,0,0,0.25)] backdrop-blur-xl",
                subtle: "bg-white/[0.05] border border-white/[0.09]",
                input:
                    "bg-white/[0.10] border-white/[0.15] text-white placeholder:text-white/45 backdrop-blur-md focus:border-white/[0.22] focus:bg-white/[0.12]",
                select: "bg-[#26221f] border-[#4d3b2c] text-white",
                option: "bg-[#26221f] text-white",
                textMuted: "text-[#d6c1b2]",
                label: "text-[#fff4ed]",
                hover: "hover:bg-white/[0.12]",
                active: "bg-[#ff7a00] text-white shadow-[0_14px_30px_rgba(255,122,0,0.24)]",
                accent: "bg-[#ff7a00] text-white shadow-[0_14px_30px_rgba(255,122,0,0.24)]",
                softAccent: "bg-[#ff7a00]/15 text-[#ffcfaa] border border-[#ff7a00]/30",
                buttonPrimary: "bg-[#ff7a00] text-white hover:bg-[#ec6f00] shadow-[0_14px_30px_rgba(255,122,0,0.22)]",
                buttonSecondary:
                    "bg-white/[0.10] border border-white/[0.14] text-white hover:bg-white/[0.15]",
                logoutButton:
                    "bg-[#693721] border border-[#874a2a] text-white hover:bg-[#7a4024]",
                danger: "bg-red-600 text-white hover:bg-red-700",
                glassCard:
                    "bg-white/[0.10] border border-white/[0.14] text-white shadow-[0_20px_48px_rgba(0,0,0,0.36)] backdrop-blur-2xl",
                headerBg: "bg-[#0f0f12]/72 border-[#2f2a25] backdrop-blur-2xl",
            };

        case "violet_neon":
            return {
                pageBg:
                    "min-h-screen bg-[radial-gradient(circle_at_14%_14%,rgba(139,92,246,0.20),transparent_0,transparent_24%),radial-gradient(circle_at_86%_18%,rgba(59,130,246,0.16),transparent_0,transparent_30%),radial-gradient(circle_at_50%_100%,rgba(255,255,255,0.03),transparent_0,transparent_30%),linear-gradient(180deg,#0d1020_0%,#111427_42%,#0a0d1a_100%)] text-white",
                sidebarBg: "bg-[#11142a]/86 border-[#292e54] backdrop-blur-2xl",
                sidebarCard: "bg-white/[0.075] border border-white/[0.11] shadow-[0_12px_30px_rgba(0,0,0,0.30)] backdrop-blur-xl",
                card: "bg-white/[0.075] border border-white/[0.11] shadow-[0_16px_40px_rgba(0,0,0,0.34)] backdrop-blur-xl",
                cardSoft: "bg-white/[0.095] border border-white/[0.13] shadow-[0_12px_28px_rgba(0,0,0,0.26)] backdrop-blur-xl",
                subtle: "bg-white/[0.055] border border-white/[0.10]",
                input:
                    "bg-white/[0.10] border-white/[0.15] text-white placeholder:text-white/45 backdrop-blur-md focus:border-white/[0.22] focus:bg-white/[0.12]",
                select: "bg-[#1f2443] border-[#3f4b87] text-white",
                option: "bg-[#1f2443] text-white",
                textMuted: "text-[#c7c9f1]",
                label: "text-[#f3f4ff]",
                hover: "hover:bg-white/[0.12]",
                active: "bg-[#8b5cf6] text-white shadow-[0_14px_30px_rgba(139,92,246,0.24)]",
                accent: "bg-[#8b5cf6] text-white shadow-[0_14px_30px_rgba(139,92,246,0.24)]",
                softAccent: "bg-[#8b5cf6]/15 text-[#d9ccff] border border-[#8b5cf6]/30",
                buttonPrimary: "bg-[#8b5cf6] text-white hover:bg-[#7c4df0] shadow-[0_14px_30px_rgba(139,92,246,0.24)]",
                buttonSecondary:
                    "bg-white/[0.10] border border-white/[0.14] text-white hover:bg-white/[0.15]",
                logoutButton:
                    "bg-[#34295f] border border-[#48367d] text-white hover:bg-[#3d3070]",
                danger: "bg-red-600 text-white hover:bg-red-700",
                glassCard:
                    "bg-white/[0.10] border border-white/[0.14] text-white shadow-[0_20px_48px_rgba(0,0,0,0.36)] backdrop-blur-2xl",
                headerBg: "bg-[#0d1020]/72 border-[#2e3561] backdrop-blur-2xl",
            };

        case "aqua_lux":
            return {
                pageBg:
                    "min-h-screen bg-[radial-gradient(circle_at_15%_14%,rgba(0,229,255,0.16),transparent_0,transparent_22%),radial-gradient(circle_at_85%_18%,rgba(45,212,191,0.14),transparent_0,transparent_28%),radial-gradient(circle_at_50%_100%,rgba(255,255,255,0.03),transparent_0,transparent_30%),linear-gradient(180deg,#09161a_0%,#0c1b20_42%,#071216_100%)] text-white",
                sidebarBg: "bg-[#0d1c20]/86 border-[#23424a] backdrop-blur-2xl",
                sidebarCard: "bg-white/[0.075] border border-white/[0.11] shadow-[0_12px_30px_rgba(0,0,0,0.30)] backdrop-blur-xl",
                card: "bg-white/[0.075] border border-white/[0.11] shadow-[0_16px_40px_rgba(0,0,0,0.34)] backdrop-blur-xl",
                cardSoft: "bg-white/[0.095] border border-white/[0.13] shadow-[0_12px_28px_rgba(0,0,0,0.26)] backdrop-blur-xl",
                subtle: "bg-white/[0.055] border border-white/[0.10]",
                input:
                    "bg-white/[0.10] border-white/[0.15] text-white placeholder:text-white/45 backdrop-blur-md focus:border-white/[0.22] focus:bg-white/[0.12]",
                select: "bg-[#143038] border-[#2d6470] text-white",
                option: "bg-[#143038] text-white",
                textMuted: "text-[#bfe9e7]",
                label: "text-[#efffff]",
                hover: "hover:bg-white/[0.12]",
                active: "bg-[#00cfd5] text-black shadow-[0_14px_30px_rgba(0,207,213,0.24)]",
                accent: "bg-[#00cfd5] text-black shadow-[0_14px_30px_rgba(0,207,213,0.24)]",
                softAccent: "bg-[#00cfd5]/15 text-[#bdfcff] border border-[#00cfd5]/30",
                buttonPrimary: "bg-[#00cfd5] text-black hover:bg-[#00bac0] shadow-[0_14px_30px_rgba(0,207,213,0.24)]",
                buttonSecondary:
                    "bg-white/[0.10] border border-white/[0.14] text-white hover:bg-white/[0.15]",
                logoutButton:
                    "bg-[#1d5c63] border border-[#27727b] text-white hover:bg-[#236870]",
                danger: "bg-red-600 text-white hover:bg-red-700",
                glassCard:
                    "bg-white/[0.10] border border-white/[0.14] text-white shadow-[0_20px_48px_rgba(0,0,0,0.36)] backdrop-blur-2xl",
                headerBg: "bg-[#09161a]/72 border-[#27555f] backdrop-blur-2xl",
            };

        case "ruby_night":
            return {
                pageBg:
                    "min-h-screen bg-[radial-gradient(circle_at_15%_14%,rgba(225,29,72,0.16),transparent_0,transparent_22%),radial-gradient(circle_at_86%_18%,rgba(190,24,93,0.14),transparent_0,transparent_28%),radial-gradient(circle_at_50%_100%,rgba(255,255,255,0.03),transparent_0,transparent_30%),linear-gradient(180deg,#140b10_0%,#170d12_44%,#10080d_100%)] text-white",
                sidebarBg: "bg-[#180e14]/86 border-[#3e2031] backdrop-blur-2xl",
                sidebarCard: "bg-white/[0.075] border border-white/[0.11] shadow-[0_12px_30px_rgba(0,0,0,0.30)] backdrop-blur-xl",
                card: "bg-white/[0.075] border border-white/[0.11] shadow-[0_16px_40px_rgba(0,0,0,0.34)] backdrop-blur-xl",
                cardSoft: "bg-white/[0.095] border border-white/[0.13] shadow-[0_12px_28px_rgba(0,0,0,0.26)] backdrop-blur-xl",
                subtle: "bg-white/[0.055] border border-white/[0.10]",
                input:
                    "bg-white/[0.10] border-white/[0.15] text-white placeholder:text-white/45 backdrop-blur-md focus:border-white/[0.22] focus:bg-white/[0.12]",
                select: "bg-[#2b1620] border-[#5a2b43] text-white",
                option: "bg-[#2b1620] text-white",
                textMuted: "text-[#efc6d2]",
                label: "text-[#fff1f5]",
                hover: "hover:bg-white/[0.12]",
                active: "bg-[#e11d48] text-white shadow-[0_14px_30px_rgba(225,29,72,0.24)]",
                accent: "bg-[#e11d48] text-white shadow-[0_14px_30px_rgba(225,29,72,0.24)]",
                softAccent: "bg-[#e11d48]/15 text-[#ffc3d0] border border-[#e11d48]/30",
                buttonPrimary: "bg-[#e11d48] text-white hover:bg-[#cf1a43] shadow-[0_14px_30px_rgba(225,29,72,0.22)]",
                buttonSecondary:
                    "bg-white/[0.10] border border-white/[0.14] text-white hover:bg-white/[0.15]",
                logoutButton:
                    "bg-[#612039] border border-[#7a2848] text-white hover:bg-[#6d2440]",
                danger: "bg-red-600 text-white hover:bg-red-700",
                glassCard:
                    "bg-white/[0.10] border border-white/[0.14] text-white shadow-[0_20px_48px_rgba(0,0,0,0.36)] backdrop-blur-2xl",
                headerBg: "bg-[#140b10]/72 border-[#4a2235] backdrop-blur-2xl",
            };

        case "blush_pop":
            return {
                pageBg:
                    "min-h-screen bg-[radial-gradient(circle_at_12%_10%,rgba(236,95,149,0.12),transparent_0,transparent_24%),radial-gradient(circle_at_88%_14%,rgba(255,255,255,0.42),transparent_0,transparent_28%),linear-gradient(180deg,#fff4f8_0%,#fff1f6_42%,#fde8ef_100%)] text-[#4a2333]",
                sidebarBg: "bg-[#fff8fb]/84 border-[#f3cddd] backdrop-blur-2xl",
                sidebarCard: "bg-white/74 border border-white/62 shadow-[0_12px_30px_rgba(236,95,149,0.08)] backdrop-blur-xl",
                card: "bg-white/70 border border-white/60 shadow-[0_16px_36px_rgba(236,95,149,0.10)] backdrop-blur-xl",
                cardSoft: "bg-white/82 border border-white/66 shadow-[0_12px_26px_rgba(236,95,149,0.07)] backdrop-blur-xl",
                subtle: "bg-[#ffe7f0] border border-[#f3cad8]",
                input:
                    "bg-white/86 border-white/66 text-[#4a2333] placeholder:text-[#9a6b7f] backdrop-blur-md focus:border-[#efbfd0] focus:bg-white",
                select: "bg-white border-[#efbfd0] text-[#4a2333]",
                option: "bg-white text-[#4a2333]",
                textMuted: "text-[#95697b]",
                label: "text-[#5b2e40]",
                hover: "hover:bg-[#ffe4ee]",
                active: "bg-[#ec5f95] text-white shadow-[0_12px_28px_rgba(236,95,149,0.18)]",
                accent: "bg-[#ec5f95] text-white shadow-[0_12px_28px_rgba(236,95,149,0.18)]",
                softAccent: "bg-[#fbd4e3] text-[#9e3c63] border border-[#f2b7cc]",
                buttonPrimary: "bg-[#ec5f95] text-white hover:bg-[#dd4f86] shadow-[0_12px_28px_rgba(236,95,149,0.18)]",
                buttonSecondary:
                    "bg-white/86 border border-[#efbfd0] text-[#4a2333] hover:bg-[#ffe7f0]",
                logoutButton:
                    "bg-[#b55476] border border-[#b55476] text-white hover:bg-[#a34869]",
                danger: "bg-red-600 text-white hover:bg-red-700",
                glassCard:
                    "bg-white/68 border border-white/58 text-[#4a2333] shadow-[0_18px_40px_rgba(236,95,149,0.08)] backdrop-blur-2xl",
                headerBg: "bg-[#fff1f6]/78 border-[#f3cad8] backdrop-blur-2xl",
            };

        case "cotton_candy":
            return {
                pageBg:
                    "min-h-screen bg-[radial-gradient(circle_at_12%_10%,rgba(214,107,255,0.12),transparent_0,transparent_24%),radial-gradient(circle_at_88%_14%,rgba(255,255,255,0.42),transparent_0,transparent_28%),linear-gradient(180deg,#fef7ff_0%,#fdf4ff_44%,#f7e9fb_100%)] text-[#44275a]",
                sidebarBg: "bg-[#fff9ff]/84 border-[#ebd3f7] backdrop-blur-2xl",
                sidebarCard: "bg-white/74 border border-white/62 shadow-[0_12px_30px_rgba(214,107,255,0.08)] backdrop-blur-xl",
                card: "bg-white/70 border border-white/60 shadow-[0_16px_36px_rgba(214,107,255,0.10)] backdrop-blur-xl",
                cardSoft: "bg-white/82 border border-white/66 shadow-[0_12px_26px_rgba(214,107,255,0.07)] backdrop-blur-xl",
                subtle: "bg-[#f8eaff] border border-[#e8d3f3]",
                input:
                    "bg-white/86 border-white/66 text-[#44275a] placeholder:text-[#8f72a2] backdrop-blur-md focus:border-[#dec1ec] focus:bg-white",
                select: "bg-white border-[#dec1ec] text-[#44275a]",
                option: "bg-white text-[#44275a]",
                textMuted: "text-[#8b71a0]",
                label: "text-[#55346d]",
                hover: "hover:bg-[#f6eaff]",
                active: "bg-[#d66bff] text-white shadow-[0_12px_28px_rgba(214,107,255,0.18)]",
                accent: "bg-[#d66bff] text-white shadow-[0_12px_28px_rgba(214,107,255,0.18)]",
                softAccent: "bg-[#f1d8ff] text-[#8b3eb1] border border-[#e4b8fb]",
                buttonPrimary: "bg-[#d66bff] text-white hover:bg-[#c85af5] shadow-[0_12px_28px_rgba(214,107,255,0.18)]",
                buttonSecondary:
                    "bg-white/86 border border-[#dec1ec] text-[#44275a] hover:bg-[#f6eaff]",
                logoutButton:
                    "bg-[#9c5cbc] border border-[#9c5cbc] text-white hover:bg-[#8d4fb0]",
                danger: "bg-red-600 text-white hover:bg-red-700",
                glassCard:
                    "bg-white/68 border border-white/58 text-[#44275a] shadow-[0_18px_40px_rgba(214,107,255,0.08)] backdrop-blur-2xl",
                headerBg: "bg-[#fdf4ff]/78 border-[#e8d3f3] backdrop-blur-2xl",
            };

        case "pearl_rose":
            return {
                pageBg:
                    "min-h-screen bg-[radial-gradient(circle_at_12%_10%,rgba(204,127,149,0.10),transparent_0,transparent_22%),radial-gradient(circle_at_88%_14%,rgba(255,255,255,0.45),transparent_0,transparent_28%),linear-gradient(180deg,#fffafa_0%,#fff7f8_44%,#fbecef_100%)] text-[#3f2a2f]",
                sidebarBg: "bg-[#fffdfd]/84 border-[#ecd8dc] backdrop-blur-2xl",
                sidebarCard: "bg-white/76 border border-white/64 shadow-[0_12px_28px_rgba(155,90,105,0.07)] backdrop-blur-xl",
                card: "bg-white/72 border border-white/60 shadow-[0_16px_34px_rgba(155,90,105,0.09)] backdrop-blur-xl",
                cardSoft: "bg-white/86 border border-white/68 shadow-[0_12px_24px_rgba(155,90,105,0.06)] backdrop-blur-xl",
                subtle: "bg-[#fdf0f2] border border-[#ead6da]",
                input:
                    "bg-white/88 border-white/66 text-[#3f2a2f] placeholder:text-[#8a6a72] backdrop-blur-md focus:border-[#dfc1c8] focus:bg-white",
                select: "bg-white border-[#dfc1c8] text-[#3f2a2f]",
                option: "bg-white text-[#3f2a2f]",
                textMuted: "text-[#886b72]",
                label: "text-[#51383f]",
                hover: "hover:bg-[#fcecef]",
                active: "bg-[#cc7f95] text-white shadow-[0_12px_28px_rgba(204,127,149,0.16)]",
                accent: "bg-[#cc7f95] text-white shadow-[0_12px_28px_rgba(204,127,149,0.16)]",
                softAccent: "bg-[#f5dde4] text-[#8e5364] border border-[#e7bec9]",
                buttonPrimary: "bg-[#cc7f95] text-white hover:bg-[#be7187] shadow-[0_12px_28px_rgba(204,127,149,0.16)]",
                buttonSecondary:
                    "bg-white/86 border border-[#dfc1c8] text-[#3f2a2f] hover:bg-[#fcecef]",
                logoutButton:
                    "bg-[#9b5a69] border border-[#9b5a69] text-white hover:bg-[#8c4f5d]",
                danger: "bg-red-600 text-white hover:bg-red-700",
                glassCard:
                    "bg-white/70 border border-white/60 text-[#3f2a2f] shadow-[0_18px_40px_rgba(155,90,105,0.07)] backdrop-blur-2xl",
                headerBg: "bg-[#fff7f8]/78 border-[#ead6da] backdrop-blur-2xl",
            };

        case "mint_day":
            return {
                pageBg:
                    "min-h-screen bg-[radial-gradient(circle_at_12%_10%,rgba(40,196,147,0.10),transparent_0,transparent_22%),radial-gradient(circle_at_88%_14%,rgba(255,255,255,0.44),transparent_0,transparent_28%),linear-gradient(180deg,#f5fffb_0%,#eefcf7_44%,#e4f7ef_100%)] text-[#1f3d35]",
                sidebarBg: "bg-[#f8fffc]/84 border-[#cfeadf] backdrop-blur-2xl",
                sidebarCard: "bg-white/76 border border-white/62 shadow-[0_12px_28px_rgba(40,196,147,0.07)] backdrop-blur-xl",
                card: "bg-white/72 border border-white/60 shadow-[0_16px_34px_rgba(40,196,147,0.09)] backdrop-blur-xl",
                cardSoft: "bg-white/84 border border-white/66 shadow-[0_12px_24px_rgba(40,196,147,0.06)] backdrop-blur-xl",
                subtle: "bg-[#ddf7ee] border border-[#c7e9db]",
                input:
                    "bg-white/86 border-white/66 text-[#1f3d35] placeholder:text-[#62867a] backdrop-blur-md focus:border-[#b8dfcf] focus:bg-white",
                select: "bg-white border-[#b8dfcf] text-[#1f3d35]",
                option: "bg-white text-[#1f3d35]",
                textMuted: "text-[#618378]",
                label: "text-[#295044]",
                hover: "hover:bg-[#e5faf2]",
                active: "bg-[#28c493] text-white shadow-[0_12px_28px_rgba(40,196,147,0.18)]",
                accent: "bg-[#28c493] text-white shadow-[0_12px_28px_rgba(40,196,147,0.18)]",
                softAccent: "bg-[#cff4e6] text-[#1f7f62] border border-[#afe5d2]",
                buttonPrimary: "bg-[#28c493] text-white hover:bg-[#22b286] shadow-[0_12px_28px_rgba(40,196,147,0.18)]",
                buttonSecondary:
                    "bg-white/86 border border-[#b8dfcf] text-[#1f3d35] hover:bg-[#e9faf4]",
                logoutButton:
                    "bg-[#3e8b73] border border-[#3e8b73] text-white hover:bg-[#367a65]",
                danger: "bg-red-600 text-white hover:bg-red-700",
                glassCard:
                    "bg-white/68 border border-white/58 text-[#1f3d35] shadow-[0_18px_40px_rgba(40,196,147,0.07)] backdrop-blur-2xl",
                headerBg: "bg-[#eefcf7]/78 border-[#c7e9db] backdrop-blur-2xl",
            };

        case "sky_breeze":
            return {
                pageBg:
                    "min-h-screen bg-[radial-gradient(circle_at_12%_10%,rgba(79,156,255,0.10),transparent_0,transparent_22%),radial-gradient(circle_at_88%_14%,rgba(255,255,255,0.44),transparent_0,transparent_28%),linear-gradient(180deg,#f8fcff_0%,#f1f8ff_44%,#e7f2fc_100%)] text-[#20364f]",
                sidebarBg: "bg-[#f9fcff]/84 border-[#cfe1f4] backdrop-blur-2xl",
                sidebarCard: "bg-white/76 border border-white/62 shadow-[0_12px_28px_rgba(79,156,255,0.07)] backdrop-blur-xl",
                card: "bg-white/72 border border-white/60 shadow-[0_16px_34px_rgba(79,156,255,0.09)] backdrop-blur-xl",
                cardSoft: "bg-white/84 border border-white/66 shadow-[0_12px_24px_rgba(79,156,255,0.06)] backdrop-blur-xl",
                subtle: "bg-[#e3f0fc] border border-[#cddff0]",
                input:
                    "bg-white/86 border-white/66 text-[#20364f] placeholder:text-[#69829e] backdrop-blur-md focus:border-[#bdd4eb] focus:bg-white",
                select: "bg-white border-[#bdd4eb] text-[#20364f]",
                option: "bg-white text-[#20364f]",
                textMuted: "text-[#687f99]",
                label: "text-[#2a4664]",
                hover: "hover:bg-[#e9f4ff]",
                active: "bg-[#4f9cff] text-white shadow-[0_12px_28px_rgba(79,156,255,0.18)]",
                accent: "bg-[#4f9cff] text-white shadow-[0_12px_28px_rgba(79,156,255,0.18)]",
                softAccent: "bg-[#d8eaff] text-[#3069b8] border border-[#bdd8ff]",
                buttonPrimary: "bg-[#4f9cff] text-white hover:bg-[#418ff5] shadow-[0_12px_28px_rgba(79,156,255,0.18)]",
                buttonSecondary:
                    "bg-white/86 border border-[#bdd4eb] text-[#20364f] hover:bg-[#edf6ff]",
                logoutButton:
                    "bg-[#4c78a8] border border-[#4c78a8] text-white hover:bg-[#426b96]",
                danger: "bg-red-600 text-white hover:bg-red-700",
                glassCard:
                    "bg-white/68 border border-white/58 text-[#20364f] shadow-[0_18px_40px_rgba(79,156,255,0.07)] backdrop-blur-2xl",
                headerBg: "bg-[#f1f8ff]/78 border-[#cddff0] backdrop-blur-2xl",
            };

        case "warm":
        default:
            return {
                pageBg:
                    "min-h-screen bg-[radial-gradient(circle_at_12%_10%,rgba(165,106,58,0.10),transparent_0,transparent_22%),radial-gradient(circle_at_88%_14%,rgba(255,255,255,0.42),transparent_0,transparent_28%),linear-gradient(180deg,#fbf6ef_0%,#f6f1e8_44%,#efe6da_100%)] text-[#2f241d]",
                sidebarBg: "bg-[#fffaf3]/84 border-[#e7d8c7] backdrop-blur-2xl",
                sidebarCard: "bg-white/72 border border-white/58 shadow-[0_12px_30px_rgba(165,106,58,0.08)] backdrop-blur-xl",
                card: "bg-white/66 border border-white/56 shadow-[0_16px_38px_rgba(165,106,58,0.10)] backdrop-blur-xl",
                cardSoft: "bg-white/78 border border-white/62 shadow-[0_12px_26px_rgba(165,106,58,0.07)] backdrop-blur-xl",
                subtle: "bg-[#f9f2e8] border border-[#eadfce]",
                input:
                    "bg-white/78 border-white/58 text-[#2f241d] placeholder:text-[#6b5b4d] backdrop-blur-md focus:border-[#d9c6b2] focus:bg-white/88",
                select: "bg-white border-[#d9c6b2] text-[#2f241d]",
                option: "bg-white text-[#2f241d]",
                textMuted: "text-[#6a5a4d]",
                label: "text-[#3f3128]",
                hover: "hover:bg-[#f3e8dc]",
                active: "bg-[#a56a3a] text-white shadow-[0_12px_28px_rgba(165,106,58,0.18)]",
                accent: "bg-[#a56a3a] text-white shadow-[0_12px_28px_rgba(165,106,58,0.18)]",
                softAccent: "bg-[#f1e5d7] text-[#6b4f3a] border border-[#e0c8b0]",
                buttonPrimary: "bg-[#a56a3a] text-white hover:bg-[#8d582e] shadow-[0_12px_28px_rgba(165,106,58,0.18)]",
                buttonSecondary:
                    "bg-white/82 border border-[#d9c6b2] text-[#2f241d] hover:bg-[#f3e8dc]",
                logoutButton:
                    "bg-[#8e4a3a] border border-[#8e4a3a] text-white hover:bg-[#7b3f31]",
                danger: "bg-red-600 text-white hover:bg-red-700",
                glassCard:
                    "bg-white/58 border border-white/54 text-[#2f241d] shadow-[0_20px_42px_rgba(165,106,58,0.10)] backdrop-blur-2xl",
                headerBg: "bg-[#f6f1e8]/78 border-[#eadfce] backdrop-blur-2xl",
            };
    }
}