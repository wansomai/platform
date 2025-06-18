// components/PostCard.tsx
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";


const LegalDocCard = ({ post, type }: { post: any; type: string }) => {
  return (
    <div className="bg-white rounded-lg overflow-hidden shadow-sm group h-full flex flex-col">
      <div className="relative h-[240px] overflow-hidden">
        {post.image ? (
          <Image
            src={post.image}
            alt={post.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
            <span className="text-gray-400">No image</span>
          </div>
        )}
      </div>
      <div className="p-8 flex flex-col flex-grow">
        <h3 
          className="font-marcellus text-xl mb-4" 
          dangerouslySetInnerHTML={{ __html: post.title }}
        />
        {post.preview && (
          <p className="font-jost text-slate-600 mb-4 line-clamp-3"  dangerouslySetInnerHTML={{ __html: post.preview }}></p>
        )}
        <div className="flex justify-between items-center mt-auto">
          <span className="font-jost text-sm text-slate-500">
            {post.date}
          </span>
          <Link 
            href={post.link} 
            className="flex items-center text-[#2E1A47] font-jost group"
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