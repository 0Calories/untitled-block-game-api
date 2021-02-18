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
  mutation($data: LoginInput!) {
    login(data: $data) {
      token,
      user {
        id
        username
      }
    }
  }
`;

const updateCharacter = gql`
  mutation($data: UpdateCharacterInput!) {
    updateCharacter(data: $data) {
      colour
      bio
    }
  }           
`;

const createWorld = gql`
  mutation($data: CreateWorldInput!) {
    createWorld(data: $data) {
      id
      name
      description
    }
  }
`;

const visitWorld = gql`
  mutation($worldId: Int!) {
    visitWorld(worldId: $worldId) {
      id
      visits
      name
      description
      creator {
        bobux
      }
    }
  }
`;

const updateWorld = gql`
  mutation($data: UpdateWorldInput!) {
    updateWorld(data: $data) {
      id
      name
      description
    }
  }
`;

const deleteWorld = gql`
  mutation($worldId: Int!) {
    deleteWorld(worldId: $worldId) {
      id
      name
      description
    }
  }
`;

export { createUser, login, updateCharacter, createWorld, visitWorld, updateWorld, deleteWorld };
