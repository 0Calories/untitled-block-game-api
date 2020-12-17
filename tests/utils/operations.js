import { gql } from 'graphql-request';

const createUser = gql`
  mutation($data: CreateUserInput!) {
    createUser(data: $data) {
      token,
      user {
        id
        username
        email
      }
    }
  }
`;

const login = gql`
  mutation($email: String, $username: String, $password: String!) {
    login(email: $email, username: $username, password: $password) {
      token,
      user {
        id
        username
      }
    }
  }
`;

const getUsers = gql`
  query($query: String) {
    users(query: $query) {
      id
      username
      bio
      email
      password
    }
  }
`;



export { createUser, login, getUsers };