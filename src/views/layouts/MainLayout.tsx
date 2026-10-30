export const MainLayout = ({ children, title = "Logos LAB — Edukasi Alkitab dan Berpikir Kritis" }: { children: string, title?: string }) => `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="Logos LAB — Platform edukasi Alkitab dan berpikir kritis. Belajar melalui game interaktif, materi PDF, dan video pembelajaran.">
  <title>${title}</title>
  <link rel="icon" href="/public/assets/logo.png" type="image/png">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
  <link rel="stylesheet" href="/public/css/style.css?v=3.2">
  <link rel="stylesheet" href="/public/css/auth-modal.css?v=2.3">
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      corePlugins: { preflight: false }
    }
  </script>
  <script src="/public/js/tailwind-config.js"></script>
  <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
</head>
<body class="bg-[#F8FAFC]">
  ${children}
  <script src="/public/js/main.js?v=1.5"></script>
</body>
</html>
`;
