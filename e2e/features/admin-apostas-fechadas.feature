# language: pt

Funcionalidade: Fila de apostas fechadas no admin
  Como administrador
  Quero resolver apostas fechadas em lote
  Para concluir o ciclo de vida das apostas

  @admin @regression @creates-closed-bet
  Cenário: Admin visualiza aposta expirada como fechada na fila
    Dado que estou logado como "admin"
    E existe uma aposta fechada de teste via API
    Quando navego para "/admin/bets/closed"
    Então devo ver a aposta fechada de teste na fila

  @admin @regression @creates-closed-bet
  Cenário: Admin resolve aposta fechada de teste na fila
    Dado que estou logado como "admin"
    E existe uma aposta fechada de teste via API
    Quando navego para "/admin/bets/closed"
    E resolvo a aposta fechada de teste com a odd "Opcao A"
    Então a aposta fechada de teste não deve aparecer na fila
