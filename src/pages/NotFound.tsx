import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

const NotFound = () => {
  const location = useLocation();
  const { i18n } = useTranslation();
  const isPt = i18n.resolvedLanguage?.startsWith("pt") || i18n.language.startsWith("pt");

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">404</h1>
        <p className="mb-4 text-xl text-muted-foreground">
          {isPt ? "Ops! Página não encontrada" : "Oops! Page not found"}
        </p>
        <a href="/" className="text-primary underline hover:text-primary/90">
          {isPt ? "Voltar para a página inicial" : "Return to Home"}
        </a>
      </div>
    </div>
  );
};

export default NotFound;
