# 📸 S3 Casamento - Galeria de Fotos

Sistema completo para compartilhamento de fotos de casamento usando AWS.

## 🚀 Funcionalidades

- **Upload de fotos** para S3 via interface web
- **Galeria responsiva** com visualização em grid
- **Slider de imagens** com navegação touch/swipe
- **Barra de progresso** interativa para navegação
- **Modal fullscreen** para visualização das fotos
- **CORS configurado** para segurança
- **Deploy no Amplify** para hospedagem

## 🏗️ Arquitetura

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Amplify   │    │     S3      │    │   Cognito   │
│  (Website)  │───▶│  (Storage)  │◀───│   (Auth)    │
└─────────────┘    └─────────────┘    └─────────────┘
       │                   │
       └───────────────────┼─────────────────────┐
                           │                     │
                    ┌─────────────┐    ┌─────────────┐
                    │ CloudFront  │    │    IAM      │
                    │    (CDN)    │    │ (Policies)  │
                    └─────────────┘    └─────────────┘
```

## 📁 Estrutura do Projeto

```
s3-casamento/
├── terraform/           # Infraestrutura como código
│   ├── main.tf         # Configuração principal
│   ├── s3.tf           # Bucket S3
│   ├── cognito.tf      # Autenticação
│   ├── cloudfront.tf   # CDN
│   ├── amplify.tf      # Hospedagem
│   ├── policies.tf     # Permissões IAM
│   └── variables.tf    # Variáveis
├── website/            # Aplicação web
│   ├── index.html      # Página principal
│   ├── styles.css      # Estilos
│   ├── script.js       # Funcionalidades
│   ├── config.js       # Configurações AWS
│   └── *.jpg           # Imagens
└── README.md
```

## 🛠️ Tecnologias

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Cloud**: AWS S3, Cognito, CloudFront, Amplify
- **IaC**: Terraform
- **Autenticação**: AWS Cognito Identity Pool

## 📱 Recursos Mobile

- **Touch/Swipe** para navegação entre fotos
- **Tela cheia** no mobile para melhor visualização
- **Barra de progresso** responsiva
- **Interface otimizada** para dispositivos móveis

## 🔧 Deploy

### 1. Configurar Terraform

```bash
cd terraform
terraform init
terraform plan
terraform apply
```

### 2. Deploy no Amplify

1. Acesse o Console AWS Amplify
2. Selecione a aplicação criada
3. Faça upload da pasta `website/`
4. Deploy automático

### 3. Configurar CORS

O CORS é configurado automaticamente pelo Terraform para permitir apenas o domínio do Amplify.

## 💰 Custos Estimados

- **S3**: Gratuito (até 5GB)
- **Amplify**: Gratuito (até 1GB + 15GB transferência)
- **Cognito**: Gratuito (até 50.000 MAUs)
- **CloudFront**: ~$0.085/GB

**Total mensal**: $0-5 para uso típico de casamento

## 🔒 Segurança

- **CORS restrito** apenas ao domínio Amplify
- **Cognito Identity Pool** para autenticação
- **IAM Policies** com permissões mínimas
- **HTTPS** obrigatório via CloudFront

## 🎨 Interface

- **Design responsivo** para desktop e mobile
- **Slider interativo** com barra de progresso
- **Animações suaves** e transições
- **Cores neutras** (branco/preto/cinza)

## 📝 Como Usar

1. **Acesse** a URL do Amplify
2. **Adicione fotos** clicando em "Adicionar Fotos"
3. **Visualize** clicando nas miniaturas
4. **Navegue** usando swipe ou barra de progresso
5. **Compartilhe** a URL com os convidados

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -m 'Add nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para detalhes.