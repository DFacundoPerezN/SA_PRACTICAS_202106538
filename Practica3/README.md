# Practica 3

En este espacio de documentación se muestran los resultados de los logs de pruebas que se hicieron para comprobar el funcionamiento de la creación de ordenes de envio por parte del usuario cliente.

## Logs de Fallo

### Fallo 1: 

Este fallo muestra en Postman lo que pasa cuando se intenta hacer una petición con cantidad 0 de un producto

![Fallo 1](./img/Fallo1.png)

### Fallo 2: 

En este caso es cuando se intenta hacer una orden pero no hay items en el listado de productos pedidos. 
![Fallo 2](./img/Fallo2.png)

### Fallo 3: 

Este ocurre cuando el producto que se mando a llamar no existe en la base de datos segun su id
![Fallo 3](./img/Fallo3.png)

### Fallo 4: 

Este es el fallo que se muestra desde thunder Client, extension de VS code, Ocurre cuando se hace el pedido de un producto que no esta dispoble. 

![Fallo 4](./img/Fallo4.png)

### Fallo 5:

Este fallo ocurre cuando en el listado de productos se ingresan unos que son de diferentes restaurantes. Opcion la cual no esta permitida

![Fallo 5](./img/Fallo5.png)

## Logs de Exito

### Exito 1: 

En este caso se hizo la prueba desde el api-gateaway con dos productos del mismo restaurante uno con y el otro sin comentario.

![Exito 1](./img/Exito1.png)

### Exito 2: 

En esta prueba se envio al servidor api-gateway una orden como solo un producto. 
![Exito 2](./img/Exito2.png)

### Exito 3: 

Tercera prueba con resultado exitoso que se realizo utilizando thunder client para la prueba del endpoint. Un solo producto con informacion extra.
![Exito 3](./img/Exito3.png)

### Exito 4: 

Prueba en el frontend en la que se mando una solicitud con un unico producto, respondio exitosamente. 

![Exito 4](./img/Exito4.png)

### Exito 5:

Esta respuesta de exito ocurre cuando en el frontend se hace una solicitud de dos productos de diferentes categorias pero del mismo restauratne y tambien con cantidades diferentes.

![Exito 5](./img/Exito5.png)