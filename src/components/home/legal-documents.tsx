// components/PostCard.tsx
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

const LegalDocCard = ({ post, type }: { post: any; type: string }) => {
  return (
    <div className="bg-white rounded-lg overflow-hidden shadow-sm group h-full flex">
      
         <div className=" bg-gray-200 flex items-center justify-center">
            <Image
            src={'/contract-sample.webp'}
            alt={post.title}
            height={300}
            width={100}
            className="object-cover transition-transform duration-500 group-hover:scale-110"
          />
      </div>
      <div className="p-8 flex flex-col flex-grow">
        <h3 
          className="font-marcellus text-lg mb-4" 
          dangerouslySetInnerHTML={{ __html: post.title }}
        />
        <div className="flex justify-between items-center mt-auto">
          <Link 
            href={post.link} 
            className="flex items-center text-amber-500 font-jost group"
          >
            Read More 
            <ArrowRight className="w-4 h-4 ml-2 group-hover:ml-3 transition-all" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LegalDocCard;