package grpc

import (
	"context"
	"delivery-proto/userpb"
)

type UserClient struct {
	client userpb.UserServiceClient
}

func NewUserClient(client userpb.UserServiceClient) *UserClient {
	return &UserClient{client: client}
}

type UserDTO struct {
	Id       int32
	Email    string
	Password string
}

func (c *UserClient) GetUserByEmail(ctx context.Context, email string) (*UserDTO, error) {

	res, err := c.client.GetUserByEmail(ctx, &userpb.GetUserByEmailRequest{
		Email: email,
	})
	if err != nil {
		return nil, err
	}

	// OJO: ahora usamos los campos directos
	return &UserDTO{
		Id:       res.Id,
		Email:    res.Email,
		Password: res.PasswordHash,
	}, nil
}
