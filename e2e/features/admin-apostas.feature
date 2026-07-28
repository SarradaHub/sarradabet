# language: pt

Funcionalidade: Gestão de apostas no admin
  Como administrador
  Quero gerenciar apostas
  Para controlar os mercados da plataforma

  @admin @regression
  Cenário: Admin lista apostas do seed
    Dado que estou logado como "admin"
    Quando navego para "/admin/bets"
    Então devo ver a aposta "Brasil vs Argentina - Quem ganha?"

  @admin @regression
  Cenário: Admin filtra apostas abertas
    Dado que estou logado como "admin"
    Quando navego para "/admin/bets"
    E filtro apostas por status "Abertas"
    Então devo ver a aposta "Brasil vs Argentina - Quem ganha?"

  @admin @regression @creates-bet
  Cenário: Admin cria nova aposta
    Dado que estou logado como "admin"
    E existe uma aposta de teste criada via API
    Quando navego para "/admin/bets"
    Então devo ver a aposta de teste

  @admin @regression @creates-bet
  Cenário: Admin fecha e resolve aposta de teste
    Dado que estou logado como "admin"
    E existe uma aposta de teste criada via API
    Quando navego para "/admin/bets"
    E fecho a aposta de teste
    E resolvo a aposta de teste com a odd "Opcao A"
    Então devo ver a aposta de teste resolvida

  @admin @regression @creates-bet
  Cenário: Admin exclui aposta sem votos
    Dado que estou logado como "admin"
    E existe uma aposta de teste criada via API
    Quando navego para "/admin/bets"
    E excluo a aposta de teste
    Então a aposta de teste não deve aparecer
