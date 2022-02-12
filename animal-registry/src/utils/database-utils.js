import { Sequelize, Op } from 'sequelize';

export const SEARCH_EMPTY = '<empty>';
export const SEARCH_NULL = '<null>';

const SEARCH_SPECIAL_TERM = {
  [SEARCH_EMPTY]: '',
  [SEARCH_NULL]: null
};

export function enhanceWhere(where) {
  let postWhere;
  if (typeof where === 'object') {
    postWhere = {};
    Object.keys(where).forEach(key => {
      if (where[key] !== undefined) {
        let searchValue = where[key];
        let op = Op.eq;
        let whereFn;
        if ((typeof searchValue === 'string') && !(/^[0-9]$/).test(searchValue)) {
          // Check if search value is one of the special search terms
          searchValue = SEARCH_SPECIAL_TERM[searchValue] !== undefined ?
            SEARCH_SPECIAL_TERM[searchValue] :
            searchValue;
          if ((/^%|%$/).test(searchValue)) {
            op = Op.like;
          } else if(searchValue !== '') {
            whereFn = Sequelize.where(Sequelize.fn('lower', Sequelize.col(key)), 'like', searchValue);
          }
        } else if (Array.isArray(searchValue)) {
          op = Op.in;
        }
        postWhere[key] = whereFn ? whereFn : { [op]: searchValue };
      }
    });
  }
  return postWhere;
}
