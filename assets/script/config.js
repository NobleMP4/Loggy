/**
 * Loggy — Configuration
 */

const CONFIG = {
  webhookUrl: "https://discord.com/api/webhooks/1470372923411005706/vADJNycA1P8_Rems9WrH74HRu1skT4719dR2p1k9wng63NBHBKnRXWqdAyr9J5Q9bSB2",

  persons: [
    "Wesley",
    "Loïc",
    "Esteban"
  ],

  workCategories: [
    {
      name: "Conception / Analyse",
      items: [
        { id: "wireframe", label: "Wireframe" },
        { id: "user_story", label: "User Story" },
        { id: "cahier_des_charges", label: "Cahier des charges" },
        { id: "mcd", label: "MCD" },
        { id: "mld", label: "MLD" },
        { id: "diagramme_uml", label: "Diagramme UML" },
        { id: "maquette", label: "Maquette" }
      ]
    },
    {
      name: "Développement",
      items: [
        { id: "code_front", label: "Code Front" },
        { id: "code_back", label: "Code Back" },
        { id: "code_bdd", label: "Base de données" },
        { id: "api", label: "API / Endpoints" },
        { id: "integration", label: "Intégration" }
      ]
    },
    {
      name: "Qualité / Livraison",
      items: [
        { id: "tests", label: "Tests" },
        { id: "debug", label: "Debug / Correction" },
        { id: "code_review", label: "Code Review" },
        { id: "documentation", label: "Documentation" },
        { id: "deploiement", label: "Déploiement" }
      ]
    },
    {
      name: "Gestion",
      items: [
        { id: "reunion", label: "Réunion" },
        { id: "veille", label: "Veille technologique" }
      ]
    }
  ],

  reviewer: {
    name: "Esteban",
    discordId: "427007095976493069"
  },

  channelMembers: [
    "427007095976493069",
      "1137143489419821161",
      "191197245738188800"
  ]
};
