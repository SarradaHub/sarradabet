# language: pt

Funcionalidade: Apostas e votação
  Como visitante autenticado
  Quero visualizar mercados e registrar votos com moedas
  Para participar das apostas

  @smoke
  Cenário: Visitante visualiza mercados na home
    Dado que estou na página inicial
    Então devo ver o mercado "Brasil vs Argentina - Quem ganha?"

  @smoke
  Cenário: Usuário autenticado seleciona odd e confirma voto com stake
    Dado que estou autenticado como "user"
    E que estou na página inicial
    Quando seleciono a odd "Real Madrid"
    Então a odd "Real Madrid" deve aparecer no cupom
    Quando informo stake de "10" moedas no cupom
    E confirmo os votos
    Então devo ver o texto "Votos registrados com sucesso!"

  @regression
  Cenário: Visitante visualiza mercados de futebol na home
    Dado que estou na página inicial
    Então devo ver o mercado "Brasil vs Argentina - Quem ganha?"
    E devo ver o mercado "Campeão da Champions League 2026"
    E devo ver o mercado "Libertadores 2026 - Campeão"

  @regression @creates-closed-bet
  Cenário: Visitante não vota em aposta fechada
    Dado que existe uma aposta fechada de teste via API
    E que estou na página inicial
    Então a odd "Opcao A" da aposta fechada deve estar desabilitada
