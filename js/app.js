// Telegram WebApp obyektini olish
const tg = window.Telegram?.WebApp;

// DOM elementlari
const installBtn = document.getElementById('installButton');
const statusDiv = document.getElementById('status');
const appLogo = document.getElementById('appLogo');

// Holatni ko'rsatish
function showStatus(message, isError = false) {
  statusDiv.textContent = message;
  statusDiv.className = `status ${isError ? 'error' : 'success'}`;
  setTimeout(() => {
    statusDiv.textContent = '';
    statusDiv.className = 'status';
  }, 3000);
}

// Telegram da ekanligini tekshirish
const isTelegram = !!tg;

// ========== TELEGRAM EKRANGA QO'SHISH ==========
if (isTelegram) {
  console.log('Telegram Mini App detected');
  
  // Telegram UI ni konfiguratsiya qilish
  tg.ready();
  tg.expand(); // To'liq ekran qilish
  
  // Telegram ranglarini qo'llash
  document.body.style.backgroundColor = tg.themeParams.bg_color || '#ffffff';
  document.body.style.color = tg.themeParams.text_color || '#000000';
  
  // MainButton ni sozlash (Telegram'ning o'z tugmasi)
  tg.MainButton.setText("Ekranga qo'shish");
  tg.MainButton.show();
  tg.MainButton.enable();
  
  // MainButton bosilganda
  tg.MainButton.onClick(() => {
    // 1-usul: addToHomeScreen metodi (agar mavjud bo'lsa)
    if (typeof tg.addToHomeScreen === 'function') {
      tg.addToHomeScreen();
      showStatus("Iltimos, ekranga qo'shishni tasdiqlang!");
    } 
    // 2-usul: WebApp share metodi
    else if (typeof tg.shareToStory === 'function') {
      showStatus("Brauzerda ochish uchun 👇", false);
      setTimeout(() => {
        tg.openLink(window.location.href, { try_browser: true });
      }, 1000);
    }
    else {
      showStatus("Ekranga qo'shish uchun brauzer menyusidan foydalaning", false);
    }
  });
  
  // Tugmani ko'rsatish (zaxira)
  installBtn.style.display = 'flex';
  installBtn.textContent = '➕ Ekranga qo\'shish (Telegram)';
  
} else {
  // ========== BRAUZER PWA O'RNATISH ==========
  console.log('Browser detected - PWA mode');
  let deferredPrompt;
  
  // PWA o'rnatish eventi
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    installBtn.style.display = 'flex';
    installBtn.textContent = '📱 Ilovani o\'rnatish';
    showStatus("Ilovani o'rnatish mumkin!", false);
  });
  
  // O'rnatilganligini tekshirish
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    installBtn.style.display = 'none';
    showStatus("✅ Ilova muvaffaqiyatli o'rnatildi!");
  });
}

// ========== UMUMIY INSTALL FUNKSIYASI ==========
installBtn.addEventListener('click', async () => {
  if (isTelegram) {
    // Telegram da qo'shimcha usullar
    try {
      // H1: Agar addToHomeScreen mavjud bo'lsa
      if (tg && typeof tg.addToHomeScreen === 'function') {
        tg.addToHomeScreen();
        showStatus("Ekranga qo'shish so'rovi yuborildi");
      }
      // H2: Share orqali
      else if (tg && typeof tg.shareToStory === 'function') {
        const shareUrl = window.location.href;
        tg.shareToStory(shareUrl, {
          text: "Mening ilovamni tekshirib ko'ring!"
        });
      }
      // H3: Brauzerga o'tish
      else if (tg && typeof tg.openLink === 'function') {
        showStatus("Brauzerda ochilmoqda...");
        tg.openLink(window.location.href, { try_browser: true });
      }
    } catch (err) {
      console.error('Error:', err);
      showStatus("Xatolik yuz berdi", true);
    }
  } else {
    // Brauzerda PWA o'rnatish
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        showStatus("✅ Ilova o'rnatildi!");
        installBtn.style.display = 'none';
      } else {
        showStatus("❌ O'rnatish bekor qilindi");
      }
      deferredPrompt = null;
    }
  }
});

// Logo animatsiyasi (faqat ko'rinish uchun)
if (appLogo) {
  appLogo.addEventListener('click', () => {
    appLogo.style.transform = 'scale(1.1)';
    setTimeout(() => {
      appLogo.style.transform = 'scale(1)';
    }, 200);
  });
}

// Service Worker ni ro'yxatdan o'tkazish
if ('serviceWorker' in navigator && !isTelegram) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => console.log('SW registered:', reg))
      .catch(err => console.log('SW error:', err));
  });
}
