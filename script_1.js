
      (function() {
        const trigger = document.getElementById('user-dropdown-trigger');
        const menu = document.getElementById('user-dropdown-menu');
        if (trigger && menu) {
          trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            menu.classList.toggle('active');
          });
          document.addEventListener('click', () => {
            menu.classList.remove('active');
          });
        }
      })();
    