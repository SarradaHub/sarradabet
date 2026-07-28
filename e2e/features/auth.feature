# language: pt

Funcionalidade: Autenticação de usuário
  Como usuário da plataforma
  Quero entrar, cadastrar e sair com segurança
  Para acessar recursos protegidos

  @smoke @regression
  Cenário: Login com credenciais válidas
    Dado que estou na página de login
    Quando preencho "Usuário ou e-mail" com "user"
    E preencho "Senha" com "user123"
    E clico em "Entrar"
    Então devo ver a URL contendo "/"
    E devo ver o botão "Sair"

  @regression
  Cenário: Login com credenciais inválidas
    Dado que estou na página de login
    Quando preencho "Usuário ou e-mail" com "user"
    E preencho "Senha" com "senhaErrada"
    E clico em "Entrar"
    Então devo ver o texto "Algo deu errado"
    E devo ver a URL contendo "/login"

  @smoke @regression
  Cenário: Logout do usuário autenticado
    Dado que estou logado como "user"
    Quando clico em "Sair"
    Então devo ver o botão "Entrar"
    E não devo ver o botão "Sair"

  @regression
  Cenário: Registro de novo usuário
    Dado que estou na página de cadastro
    Quando registro um novo usuário de teste
    Então devo ver a URL contendo "/coins"

  @regression
  Cenário: Registro com e-mail duplicado falha
    Dado que estou na página de cadastro
    Quando preencho "Usuário" com "novouser"
    E preencho "E-mail" com "user@sarradabet.com"
    E preencho "Telefone" com "5511999887766"
    E preencho "Senha" com "password123"
    E clico em "Cadastrar"
    Então devo ver o texto "Algo deu errado"

  @smoke @regression
  Cenário: Login admin redireciona ao dashboard
    Dado que estou na página de login admin
    Quando preencho "Usuário ou Email" com "admin"
    E preencho "Senha" com "admin123"
    E clico em "Entrar"
    Então devo ver a URL contendo "/admin/dashboard"

  @regression
  Cenário: Rota protegida redireciona após login
    Dado que não estou autenticado
    Quando navego para "/profile"
    E preencho "Usuário ou e-mail" com "user"
    E preencho "Senha" com "user123"
    E clico em "Entrar"
    Então devo ver a URL contendo "/profile"
