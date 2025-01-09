// utils/withAuth.ts
import { GetServerSidePropsContext, GetServerSidePropsResult } from 'next';
import { parseCookies } from 'nookies';

type WithAuthOptions = {
  roles?: string[]; // Allowed roles
  redirectTo?: string; // Default redirect path
};

export function withAuth<T>(
  getServerSidePropsFunc?: (ctx: GetServerSidePropsContext) => Promise<GetServerSidePropsResult<T>>,
  options: WithAuthOptions = {}
) {
  const { roles = [], redirectTo = '/' } = options;

  return async (ctx: GetServerSidePropsContext): Promise<GetServerSidePropsResult<T>> => {
    const cookies = parseCookies(ctx);
    const userRole = cookies['Role'];

    // Redirect if no role or role is not allowed
    if (!userRole || (roles.length && !roles.includes(userRole))) {
      return {
        redirect: {
          destination: redirectTo,
          permanent: false,
        },
      };
    }

    // Run the page's `getServerSideProps` if provided
    if (getServerSidePropsFunc) {
      return getServerSidePropsFunc(ctx);
    }

    return {
      props: {} as T,
    };
  };
}
