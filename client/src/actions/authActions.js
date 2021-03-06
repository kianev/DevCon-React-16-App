import axios from 'axios';
import setAuthToken from '../utils/setAuthToken';
import jwt_decode from 'jwt-decode';

import {GET_ERRORS, SET_CURRENT_USER} from './types';


//Register user
export const registerUser = (userData, history) => dispatch => {
  axios
    .post('/api/users/register', userData)
    .then(res => history.push('/login'))
    .catch(err => dispatch({type: GET_ERRORS, payload: err.response.data}));
};

//Login user get token
export const loginUser = (userData) => dispatch => {
  axios
    .post('/api/users/login', userData)
    .then(res => {
      //Save to localstorage
      const { token } = res.data;
      localStorage.setItem('jwtToken', token); 
      //Set token to authHeader
      setAuthToken(token);
      //Decode token to get user data
      const decoded = jwt_decode(token);
      //set current user
      dispatch(setCurrentUser(decoded))
    })
    .catch(err => dispatch({type: GET_ERRORS, payload: err.response.data}));
};

//Set logged in user
export const setCurrentUser = decoded => {
  return {
    type: SET_CURRENT_USER,
    payload: decoded
  }
};  

//Logout user
export const logoutUser = () => dispatch =>  {
  //remove token from localstorage
  localStorage.removeItem('jwtToken');
  //remove token from header
  setAuthToken(false);
  //set current uset to an empty object
  dispatch(setCurrentUser({}));
};