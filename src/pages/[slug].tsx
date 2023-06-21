import type { GetStaticProps, NextPage } from "next";
import Head from "next/head";
import { api } from "~/utils/api";
import { PageLayout } from "~/components/layout";
import { PostView } from "~/components/postView";

const ProfileFeed = (props: {userId: string}) => {
  const { data, isLoading } = api.posts.getPostsByUserId.useQuery({
    userId: props.userId,
  });

  if(isLoading) return <LoadingPage />;

  if(!data || !data.length) return <div>User has not posted</div>;

  return (
    <div className="flex flex-col">
      {data.map((fullPost) => (
        <PostView {...fullPost} key={fullPost.post.id} />
      ))}
    </div>
  );
};

const ProfilePage: NextPage<{username: string}> = ({ username }) => {

  const { data } = api.profile.getUserByUsername.useQuery({
    username,
  });

  if(!data) return <div>404</div>;

  return (
    <>
      <Head>
        <title>Profile</title>
      </Head>
      <PageLayout>
        <div className="relative h-36 bg-slate-600">
          <Image 
            src={data.profilePicture} 
            alt={`${data.username ?? ""} profile image`} 
            width={128}
            height={128}
            className="absolute bottom-0 left-0 ml-4 -mb-[64px] border-2 rounded-full border-black bg-black"
          />
        </div>
        <div className="h-[64px]"></div>
        <div className="p-4 text-xl font-bold">{`@${ data.username ?? ""}`}</div>
        <div className="border-b border-slate-400"></div>
        <ProfileFeed userId={data.id} />
      </PageLayout>
    </>
  );
};

import { createProxySSGHelpers } from '@trpc/react-query/ssg';
import { prisma } from "~/server/db";
import { appRouter } from "~/server/api/root";
import superjson from "superjson";
import Image from "next/image";
import { LoadingPage } from "~/components/loading";

export const getStaticProps: GetStaticProps = async (context) => {
  const ssg = createProxySSGHelpers({
    router: appRouter,
    ctx: { prisma, userId: null },
    transformer: superjson, // optional - adds superjson serialization
  });
  const slug = context.params?.slug;

  if (typeof slug !== "string") throw new Error("no slug");

  const username = slug.replace("@", "");

  await ssg.profile.getUserByUsername.prefetch({ username })

  return {
    props: {
      trpcState: ssg.dehydrate(),
      username,
    }
  }
};

export const getStaticPaths = () => {
  //generate on load, if generate at build supply paths to gen in []
  return { paths: [], fallback: "blocking" };
};

export default ProfilePage;
