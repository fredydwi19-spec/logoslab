/** @jsx html */
import { html } from "@elysiajs/html";
import { Sidebar } from "../components/Sidebar";

export const Layout = ({ children, title, username, role }: { children: any; title: string; username: string; role: string }) => {
  return (
    <html lang="id">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{title} - Logos LAB Dashboard</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
        <style>
          {`body { font-family: 'Inter', sans-serif; }`}
        </style>
      </head>
      <body class="bg-slate-50 text-slate-900">
        <div class="flex">
          <Sidebar username={username} role={role} />
          
          <div class="flex-1 ml-64 min-h-screen flex flex-col">
            {/* Header */}
            <header class="sticky top-0 z-40 bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between">
              <h1 class="text-xl font-semibold text-slate-800">{title}</h1>
              <div class="flex items-center gap-4">
                <div class="text-right">
                  <div class="text-sm font-bold">{username}</div>
                  <div class="text-xs text-slate-500 capitalize">{role.toLowerCase().replace('_', ' ')}</div>
                </div>
                <div class="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                  {username.charAt(0).toUpperCase()}
                </div>
              </div>
            </header>

            {/* Main Content */}
            <main class="flex-1 p-8">
              {children}
            </main>

            {/* Footer */}
            <footer class="p-8 text-center text-slate-400 text-sm">
              &copy; 2026 Logos LAB. Build with Elysia & Tailwind.
            </footer>
          </div>
        </div>
      </body>
    </html>
  );
};
