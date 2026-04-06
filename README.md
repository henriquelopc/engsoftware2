# Sistema de Pedidos — Engenharia de Software 2

Projeto acadêmico desenvolvido para a disciplina de **Engenharia de Software 2**, demonstrando conceitos de orientação a objetos, herança, composição e mapeamento objeto-relacional com Spring Boot e MySQL.

---

## Tecnologias

- Java 17
- Spring Boot 3.2
- Spring Data JPA / Hibernate
- MySQL 8
- Maven

---

## Estrutura do projeto

```
src/main/java/com/project/
├── SistemaPedidosApplication.java
├── entity/
│   ├── Produto.java
│   ├── ProdutoEletronico.java
│   ├── ProdutoPerecivel.java
│   ├── Pedido.java
│   └── ItemPedido.java
├── repository/
│   ├── ProdutoRepository.java
│   ├── PedidoRepository.java
│   └── ItemPedidoRepository.java
├── service/
│   ├── ProdutoService.java
│   ├── PedidoService.java
│   └── ItemPedidoService.java
└── controller/
    ├── ProdutoController.java
    ├── PedidoController.java
    └── ItemPedidoController.java
```

---

## Modelo de dados

O banco de dados `sistema_pedidos` é composto por cinco tabelas:

| Tabela | Descrição |
|---|---|
| `produto` | Tabela base do catálogo de produtos. Contém nome, preço, estoque e tipo. |
| `produto_eletronico` | Especialização de produto com campo `voltagem`. Herda de `produto`. |
| `produto_perecivel` | Especialização de produto com campo `data_validade`. Herda de `produto`. |
| `pedido` | Representa um pedido com data e valor total. |
| `item_pedido` | Linha de um pedido, relacionando produto e pedido com quantidade e valor. |

### Herança (JOINED TABLE)

```
Produto
 ├── ProdutoEletronico  (voltagem)
 └── ProdutoPerecivel   (dataValidade)
```

A estratégia de herança utilizada é **JOINED** — cada subclasse possui sua própria tabela com FK referenciando a tabela `produto`.

### Composição

```
Pedido
 └── ItemPedido (1..N)
      └── Produto
```

Um `Pedido` é composto por um ou mais `ItemPedido`, cada um referenciando um `Produto`.

---

## Configuração

### Pré-requisitos

- Java 17+
- Maven 3.8+
- MySQL 8 rodando localmente

### Banco de dados

Execute o script SQL para criar o banco e as tabelas:

```bash
mysql -u root -p < schema.sql
```

### application.properties

Edite o arquivo `src/main/resources/application.properties` e defina suas credenciais:

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/sistema_pedidos
spring.datasource.username=root
spring.datasource.password=suasenha
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
```

### Executar a aplicação

```bash
mvn spring-boot:run
```

A aplicação sobe por padrão em `http://localhost:8080`.

---

## Endpoints da API REST

### Produtos

| Método | Endpoint | Descrição |
|---|---|---|
| GET | `/produtos` | Lista todos os produtos |
| GET | `/produtos/{id}` | Busca produto por ID |
| POST | `/produtos` | Cria novo produto |
| PUT | `/produtos/{id}` | Atualiza produto existente |
| DELETE | `/produtos/{id}` | Remove produto |

### Pedidos

| Método | Endpoint | Descrição |
|---|---|---|
| GET | `/pedidos` | Lista todos os pedidos |
| GET | `/pedidos/{id}` | Busca pedido por ID |
| POST | `/pedidos` | Cria novo pedido |
| PUT | `/pedidos/{id}` | Atualiza pedido existente |
| DELETE | `/pedidos/{id}` | Remove pedido |

### Itens de Pedido

| Método | Endpoint | Descrição |
|---|---|---|
| GET | `/itens-pedido` | Lista todos os itens |
| GET | `/itens-pedido/{id}` | Busca item por ID |
| POST | `/itens-pedido` | Cria novo item |
| PUT | `/itens-pedido/{id}` | Atualiza item existente |
| DELETE | `/itens-pedido/{id}` | Remove item |

---

## Conceitos aplicados

- **Herança** com `@Inheritance(strategy = InheritanceType.JOINED)`
- **Composição** com `@OneToMany` / `@ManyToOne`
- **Repositório** com `JpaRepository` (Spring Data)
- **Camada de serviço** separada da camada de controle
- **API RESTful** com Spring MVC
