// roles.ts
export const RoleBasedAccess = {
     admin: [
       '/admin/*',         // Allow all paths under /admin

     ],
     user: [
       '/users',           // User homepage
       '/users/page',      // Specific user page
       '/users/berita/*',  // All berita paths (wildcard)
     ],
     guest: [
       '/',           // Login page
       '/',        // Registration page
     ],
   };
   
   