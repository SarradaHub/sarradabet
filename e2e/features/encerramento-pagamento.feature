# language: pt

Funcionalidade: Encerramento de apostas e pagamento de prêmios
  Como usuário e administrador
  Quero apostar com moedas e receber prêmios parimutuel
  Para completar o ciclo de vida da aposta

  @smoke @auth @payout
  Cenário: Usuário vota com sucesso em uma aposta aberta
    Dado que o usuário "user" tem saldo de moedas de "1000"
    E que estou autenticado como "user"
    E que estou na página inicial
    Quando seleciono a odd "Manchester City"
    E informo stake de "100" moedas no cupom
    E confirmo os votos
    Então devo ver o texto "Votos registrados com sucesso!"
    E o saldo de moedas do usuário "user" deve ser "900"

  @smoke @validation @payout
  Cenário: Usuário não consegue votar em uma aposta fechada
    Dado que existe uma aposta fechada de teste via API
    E que estou autenticado como "user"
    E que estou na página inicial
    Então não devo ver o mercado da aposta fechada de teste
    Quando navego para a categoria "Futebol" da aposta fechada de teste
    Então a odd "Opcao A" da aposta fechada deve estar desabilitada

  @smoke @worker @payout
  Cenário: Worker credita vencedor com pool parimutuel e taxa de 25%
    Dado que o usuário "user" tem saldo de moedas de "1000"
    E existe uma aposta de payout "Jogo Payout" via API com pote de "500" moedas
    E "300" moedas estão na odd vencedora incluindo "100" do usuário "user"
    Quando o administrador resolve a aposta "Jogo Payout" com a odd vencedora
    E os jobs de pagamento são processados
    Então o usuário "user" deve receber payout de "75" moedas
  Cenário: Administrador não pode resolver uma aposta já resolvida
    Dado que existe uma aposta resolvida de teste via API
    Quando o administrador tenta resolver novamente a aposta resolvida
    Então a API deve rejeitar com erro "Aposta já foi resolvida"

  @smoke @job
  Cenário: Job agendado transiciona apostas scheduled para open e open para closed
    Dado que existe uma aposta agendada de teste via API com início no passado
    E existe uma aposta aberta de teste via API com encerramento no passado
    Quando o job de status agendado é executado
    Então a aposta agendada deve estar com status "open"
    E a aposta aberta expirada deve estar com status "closed"
