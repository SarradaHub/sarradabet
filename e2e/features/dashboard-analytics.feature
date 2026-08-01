# language: pt

Funcionalidade: Dashboard do usuário e análises administrativas
  Como usuário autenticado e administrador
  Quero visualizar meu desempenho e métricas agregadas
  Para acompanhar evolução e monitorar o negócio

  @smoke @dashboard
  Cenário: Usuário autenticado visualiza dashboard na UI
    Dado que estou logado como "user"
    Quando acesso a página "/dashboard"
    Então devo ver o título "Meu Dashboard"
    E devo ver o texto "Taxa de acerto"

  @smoke @admin @dashboard
  Cenário: Administrador visualiza filtros analíticos no dashboard
    Dado que estou logado como "admin"
    Então devo ver o texto "Data inicial"
    E devo ver o texto "Exportar CSV"

  @smoke @admin @dashboard
  Cenário: Administrador consulta overview via API
    Dado que estou logado como "admin"
    Quando consulto a overview analítica de "2026-01-01" até "2026-01-31"
    Então a resposta analítica contém "activeUsers"

  @admin @dashboard
  Cenário: Usuário comum não acessa analytics admin via API
    Dado que estou logado como "user"
    Quando consulto a overview analítica de "2026-01-01" até "2026-01-31"
    Então a resposta HTTP analítica é 403
