# language: pt

Funcionalidade: Navegação do Menu Hambúrguer
  Como um usuário do sistema
  Eu quero navegar pelo menu hambúrguer em diferentes dispositivos
  Para que eu possa acessar todas as seções da aplicação de forma intuitiva

  Contexto:
    Dado que estou logado como "user"

  @mobile @smoke
  Cenário: Usuário abre e fecha o menu no mobile
    Dado que a viewport está em modo mobile
    E o menu de navegação está fechado
    Quando abro o menu de navegação
    Então o ícone do hambúrguer deve estar expandido
    E o menu lateral deve estar visível
    E o overlay do menu deve estar visível
    Quando fecho o menu de navegação pelo overlay
    Então o ícone do hambúrguer deve estar recolhido
    E o menu lateral não deve estar visível

  @mobile @accessibility
  Cenário: Usuário utiliza teclado para fechar o menu aberto
    Dado que a viewport está em modo mobile
    E o menu de navegação está aberto
    Quando pressiono a tecla "Escape"
    Então o ícone do hambúrguer deve estar recolhido
    E o menu lateral não deve estar visível

  @mobile @regression
  Cenário: Menu fecha ao clicar em um link de navegação
    Dado que a viewport está em modo mobile
    E o menu de navegação está aberto
    Quando clico no link "Dashboard" do menu lateral
    Então devo ver a URL contendo "/dashboard"
    E o menu lateral não deve estar visível

  @desktop @smoke
  Cenário: Menu é exibido como barra horizontal no desktop
    Dado que a viewport está em modo desktop
    Quando navego para "/"
    Então o botão hambúrguer não deve estar visível
    E devo ver o link "Ranking" na barra de navegação
    E devo ver o saldo de moedas no cabeçalho

  @desktop @active
  Cenário: Link ativo é destacado na navegação desktop
    Dado que a viewport está em modo desktop
    Quando navego para "/dashboard"
    Então o link "Dashboard" deve estar marcado como página atual

  @accessibility
  Cenário: Menu respeita preferência de movimento reduzido
    Dado que a viewport está em modo mobile
    E o sistema tem movimento reduzido ativado
    Quando abro o menu de navegação
    Então o menu lateral deve estar visível
