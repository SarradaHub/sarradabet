# language: pt

Funcionalidade: Dashboard administrativo
  Como administrador
  Quero visualizar métricas e ações rápidas
  Para acompanhar a plataforma

  @smoke @admin @regression
  Cenário: Admin visualiza cards de estatísticas
    Dado que estou logado como "admin"
    Então devo ver os cards de estatísticas do dashboard

  @admin @regression
  Cenário: Admin visualiza ações rápidas
    Dado que estou logado como "admin"
    Então devo ver as ações rápidas do dashboard
