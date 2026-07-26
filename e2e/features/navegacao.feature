# language: pt

Funcionalidade: Navegação e rotas protegidas
  Como usuário
  Quero navegar pela aplicação
  Para acessar as funcionalidades disponíveis

  @smoke
  Cenário: Rota protegida redireciona visitante para login
    Dado que não estou autenticado
    Quando navego para "/profile"
    Então devo ver a URL contendo "/login"
    E devo ver a URL contendo "redirect="

  @smoke
  Cenário: Página de moedas exige autenticação
    Dado que não estou autenticado
    Quando navego para "/coins"
    Então devo ver a URL contendo "/login"

  @smoke
  Cenário: Usuário autenticado navega entre páginas principais
    Dado que estou logado como "user"
    Quando navego para "/"
    E clico em "Moedas"
    Então devo ver a URL contendo "/coins"
    Quando clico em "user"
    Então devo ver a URL contendo "/profile"

  @regression
  Cenário: Admin navega para seções do painel
    Dado que estou logado como "admin"
    Quando clico em "Usuários"
    Então devo ver a URL contendo "/admin/users"
    Quando clico em "Pacotes"
    Então devo ver a URL contendo "/admin/coin-packages"
