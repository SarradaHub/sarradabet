# language: pt

Funcionalidade: Explicação do retorno estimado
  Como apostador
  Quero entender como o retorno é calculado
  Para apostar com transparência

  @smoke
  Cenário: Usuário expande explicação do retorno estimado
    Dado que estou autenticado como "user"
    E que estou na página inicial
    Quando seleciono a odd "Real Madrid"
    E informo stake de "100" moedas no cupom
    Então devo ver "Retorno estimado" no cupom
    Quando abro a explicação "Como o retorno é calculado?"
    Então devo ver o texto "pool parimutuel"
