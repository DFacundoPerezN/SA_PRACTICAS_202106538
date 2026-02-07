package grpcclient

import (
	"context"
	"time"

	userpb "delivery-system/proto/userpb"

	"google.golang.org/grpc"
)

type UserClient struct {
	client userpb.UserServiceClient
}

func NewUserClient(addr string) (*UserClient, error) {
	conn, err := grpc.Dial(addr, grpc.WithInsecure())
	if err != nil {
		return nil, err
	}

	return &UserClient{
		client: userpb.NewUserServiceClient(conn),
	}, nil
}

func (u *UserClient) GetUserByEmail(email string) (*userpb.GetUserByEmailResponse, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	return u.client.GetUserByEmail(ctx, &userpb.GetUserByEmailRequest{
		Email: email,
	})
}
