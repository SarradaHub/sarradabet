# language: pt

@smoke
Funcionalidade: Gamificação, ranking e recompensas
  Como usuário e administrador
  Quero ver ranking, estatísticas e resgatar recompensas
  Para participar da gamificação da plataforma

  @leaderboard
  Cenário: Usuário visualiza o ranking público
    Quando navego para "/leaderboard"
    Então devo ver o título "Ranking"

  @stats
  Cenário: Usuário autenticado visualiza estatísticas no perfil
    Dado que estou logado como "user"
    Quando navego para "/profile"
    Então devo ver o texto "Suas estatísticas"

  @rewards @smoke
  Cenário: Visitante visualiza catálogo de recompensas
    Quando navego para "/rewards"
    Então devo ver o título "Recompensas"
    E devo ver o texto "Entre na sua conta"

  @rewards @smoke
  Cenário: Usuário autenticado visualiza catálogo de recompensas
    Dado que estou logado como "user"
    Quando navego para "/rewards"
    Então devo ver o título "Recompensas"

  @admin @smoke
  Cenário: Admin gerencia recompensas
    Dado que estou logado como "admin"
    Quando navego para "/admin/rewards"
    Então devo ver o título "Recompensas"
