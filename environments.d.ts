// Source - https://stackoverflow.com/a/53981706
// Posted by Karol Majewski, modified by community. See post 'Timeline' for change history
// Retrieved 2026-05-31, License - CC BY-SA 4.0

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      DATABASE_URL: string;
    }
  }
}

// If this file has no import/export statements (i.e. is a script)
// convert it into a module by adding an empty export statement.
export {}
