# language: pt

Funcionalidade: Compra de moedas via Pix
  Como usuário autenticado
  Quero comprar moedas com Pix
  Para usar na plataforma

  @pix @regression
  Cenário: Compra com Pix mock e simulação de pagamento
    Dado que estou logado como "user"
    Quando navego para "/coins"
    E compro o primeiro pacote com Pix
    Então devo ver o pagamento Pix pendente
    Quando simulo pagamento aprovado
    Então devo ver o texto "Pagamento confirmado! Suas moedas foram creditadas."

  @pix @regression @smoke
  Cenário: Compra com QR presencial mock e simulação de pagamento
    Dado que estou logado como "user"
    Quando navego para "/coins"
    E compro o primeiro pacote com QR presencial
    Então devo ver o pagamento QR presencial pendente
    Quando simulo pagamento aprovado
    Então devo ver o texto "Pagamento confirmado! Suas moedas foram creditadas."

  @regression
  Cenário: Usuário visualiza saldo e histórico
    Dado que estou logado como "user"
    Quando navego para "/coins"
    Então devo ver meu saldo de moedas
    E devo ver o histórico de transações
