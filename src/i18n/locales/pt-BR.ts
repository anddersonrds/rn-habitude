import type { Locale } from "@/i18n/types";

/* `matches` claims the bare `pt` code, which is what a Brazilian device reports. */
const ptBR: Locale = {
  tag: "pt-BR",
  label: "Português (Brasil)",
  matches: ["pt"],
  translations: {
    common: {
      cancel: "Cancelar",
    },
    tabs: {
      today: "Hoje",
      habits: "Hábitos",
      settings: "Ajustes",
    },
    settings: {
      notifications: "Notificações",
      notificationsFooter:
        "Os lembretes são agendados apenas neste dispositivo. O habitude nunca envia nada para um servidor.",
      permission: "Permissão",
      permissionPending: "…",
      permissionAllowed: "Permitido",
      permissionNotRequested: "Não solicitado",
      permissionDenied: "Negado",
      allowNotifications: "Permitir notificações",
      openIosSettings: "Abrir os Ajustes do iOS",
      sendTestNotification: "Enviar notificação de teste",
      data: "Dados",
      dataFooter:
        "Os dados de exemplo criam cinco hábitos com doze semanas de histórico, para o gráfico de constância e o widget terem o que mostrar.",
      loadSampleData: "Carregar dados de exemplo",
      deleteAllData: "Apagar todos os dados",
      about: "Sobre",
      viewOnboarding: "Ver a apresentação",
      habits: "Hábitos",
      checkIns: "Registros",
      version: "Versão",
      notificationsOffTitle: "As notificações estão desativadas",
      notificationsOffBody:
        "Permita as notificações nos Ajustes do iOS para receber os lembretes.",
      openSettings: "Abrir os Ajustes",
      testSentTitle: "Notificação de teste enviada",
      testSentBody:
        "Ela chega em alguns segundos. Deixe o app aberto ou bloqueie a tela para ver o aviso.",
      loadSampleTitle: "Carregar dados de exemplo?",
      loadSampleBody:
        "Isso adiciona cinco hábitos de exemplo com doze semanas de histórico. Os seus hábitos são mantidos.",
      load: "Carregar",
      deleteAllTitle: "Apagar todos os dados?",
      deleteAllBody:
        "Isso apaga permanentemente todos os hábitos e o histórico deles.",
      deleteEverything: "Apagar Tudo",
    },
    language: {
      title: "Idioma",
      systemDefault: "Padrão do sistema",
    },
  },
};

export default ptBR;
