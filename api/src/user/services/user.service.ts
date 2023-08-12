import { BadRequestException, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { UserEntity } from '../models/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { LoginDto } from '../dto/loginDto';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class UserService {
    constructor(
        @InjectRepository(UserEntity)
        private readonly userRepository:Repository<UserEntity>,
        private jwtService: JwtService
    ){}

    async createUser(user: UserEntity){
        const userr:UserEntity=await this.userRepository.createQueryBuilder('user').where("user.username=:name",{name:user.username}).getOne();
        if(userr){
            throw new BadRequestException("Vec postoji user sa tim emailom");
        }else{
        user.sifra=await bcrypt.hash(user.sifra,12);
        return this.userRepository.save(user);
        }
    }
    async vratiUseraZaId(id: number): Promise<UserEntity | undefined> {
        return this.userRepository.findOneById(id);
    }
    async lajkuj(idrecepta:number,idusera:number){
        const userizbaze=await this.userRepository.findOneById(idusera);
        if (!userizbaze.lajkovaniRecepti) {
            userizbaze.lajkovaniRecepti = [];
          }
        userizbaze.lajkovaniRecepti.push(idrecepta);
        return this.userRepository.save(userizbaze);
    }
    async vratiSveUsere(){
        const user=await this.userRepository.find()
        return user
    }
    async vratiUsera(id:number){
        const user:UserEntity=await this.userRepository.findOneById(id);
        if(user!=null){
            return user
        }else{
            throw new BadRequestException("Ne postoji user");
        }
        
    }
    async findOne(username: string){
        return await this.userRepository.createQueryBuilder('user').where("user.username=:name",{name:username}).getOne();
      }
    async login(loginDto:LoginDto){
        const user:UserEntity=await this.userRepository.createQueryBuilder('user').where("user.username=:name",{name:loginDto.username}).getOne();
        
        if(user==null){
            throw new BadRequestException("Ne postoji user");
        }else{
            if(await bcrypt.compare(loginDto.sifra,user.sifra)){
                const jwt=await this.jwtService.signAsync({id:user.id,role:user.role});
                return jwt
            }
            else{
                throw new UnauthorizedException("pogresna lozinka ili username");
            }
        }
    }
    async vratiUseraCookie(data:any){
        const user=await this.userRepository.findOneById(data.id);
        return user;
    }


}
