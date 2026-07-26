# language: pt

Funcionalidade: Gestão de pacotes de moedas no admin
  Como administrador
  Quero gerenciar pacotes de moedas
  Para configurar compras via Pix

  @admin @regression
  Cenário: Admin cria pacote de moedas
    Dado que estou logado como "admin"
    Quando navego para "/admin/coin-packages"
    E crio um pacote de moedas de teste
    Então devo ver o pacote de moedas de teste

  @admin @regression
  Cenário: Admin desativa e reativa pacote
    Dado que estou logado como "admin"
    Quando navego para "/admin/coin-packages"
    E alterno o status do pacote "Pacote Básico"
    Então o pacote "Pacote Básico" deve estar ativo novamente
